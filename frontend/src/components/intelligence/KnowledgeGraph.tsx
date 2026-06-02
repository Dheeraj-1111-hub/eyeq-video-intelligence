import { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { User, Video, Backpack, Car, MapPin, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { CaseDetailsResponse } from '@/features/cases/types';

// --- Custom Node Types ---
const SubjectNode = ({ data }: NodeProps) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="px-4 py-3 shadow-[0_0_20px_rgba(30,212,237,0.3)] rounded-lg bg-zinc-950/80 backdrop-blur-md border-2 border-primary"
  >
    <Handle type="target" position={Position.Top} className="!bg-primary" />
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
        <User className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-xs font-mono text-primary uppercase tracking-wider">{data.label as string}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Primary Target</div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-primary" />
  </motion.div>
);

const CameraNode = ({ data }: NodeProps) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="px-4 py-2 shadow-lg rounded-md bg-zinc-900/90 backdrop-blur-md border border-white/10"
  >
    <Handle type="target" position={Position.Top} className="!bg-zinc-500" />
    <div className="flex items-center gap-2">
      <Video className="w-4 h-4 text-emerald-400" />
      <div className="text-xs font-medium text-zinc-200">{data.label as string}</div>
    </div>
    <div className="text-[9px] text-zinc-500 mt-1 font-mono">{data.time as string}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-zinc-500" />
  </motion.div>
);

const ObjectNode = ({ data }: NodeProps) => {
  const getIcon = () => {
    const lbl = (data.label as string).toLowerCase();
    if (['car', 'truck', 'bus', 'vehicle', 'motorcycle'].includes(lbl)) return <Car className="w-4 h-4 text-amber-400" />;
    if (['backpack', 'bag', 'suitcase', 'handbag'].includes(lbl)) return <Backpack className="w-4 h-4 text-amber-400" />;
    return <Box className="w-4 h-4 text-amber-400" />;
  };

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="px-3 py-2 shadow-lg rounded-md bg-zinc-900/90 backdrop-blur-md border border-amber-500/30"
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="text-xs font-medium text-zinc-200 capitalize">{data.label as string}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500" />
    </motion.div>
  );
};

const LocationNode = ({ data }: NodeProps) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="px-3 py-2 shadow-lg rounded-md bg-zinc-900/90 backdrop-blur-md border border-rose-500/30"
  >
    <Handle type="target" position={Position.Top} className="!bg-rose-500" />
    <div className="flex items-center gap-2">
      <MapPin className="w-4 h-4 text-rose-400" />
      <div className="text-xs font-medium text-zinc-200">{data.label as string}</div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-rose-500" />
  </motion.div>
);

const nodeTypes = {
  subject: SubjectNode,
  camera: CameraNode,
  object: ObjectNode,
  location: LocationNode,
};

interface KnowledgeGraphProps {
  caseDetails: CaseDetailsResponse;
  isTracking: boolean;
}

export function KnowledgeGraph({ caseDetails, isTracking }: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!caseDetails) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // 1. Subject Node (Top Center)
    const subjectId = `subject-${caseDetails.case._id}`;
    newNodes.push({
      id: subjectId,
      type: 'subject',
      position: { x: 300, y: 50 },
      data: { label: caseDetails.case.title.substring(0, 15) }
    });

    // Extract unique cameras (locations)
    const camerasMap = new Map();
    const objectsMap = new Map();

    caseDetails.evidence.forEach(ev => {
      const loc = ev.videoLocation || 'Unknown Location';
      const videoId = ev.videoId;

      if (!camerasMap.has(videoId)) {
        camerasMap.set(videoId, {
          id: `cam-${videoId}`,
          label: loc,
          time: ev.timestamp
        });
      }

      // If it's an object (not person)
      if (ev.label !== 'person') {
        const objKey = `${videoId}-${ev.label}`;
        if (!objectsMap.has(objKey)) {
          objectsMap.set(objKey, {
            id: `obj-${objKey}`,
            label: ev.label,
            camId: `cam-${videoId}`
          });
        }
      }
    });

    // 2. Camera Nodes
    const cams = Array.from(camerasMap.values());
    const camSpacing = 200;
    const startX = 300 - ((cams.length - 1) * camSpacing) / 2;

    cams.forEach((cam, index) => {
      newNodes.push({
        id: cam.id,
        type: 'camera',
        position: { x: startX + index * camSpacing, y: 200 },
        data: { label: cam.label, time: cam.time }
      });

      newEdges.push({
        id: `e-${subjectId}-${cam.id}`,
        source: subjectId,
        target: cam.id,
        animated: isTracking,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 }
      });
    });

    // 3. Object Nodes
    const objs = Array.from(objectsMap.values());
    
    // Group objects by camera
    const objsByCam: Record<string, any[]> = {};
    objs.forEach(obj => {
      if (!objsByCam[obj.camId]) objsByCam[obj.camId] = [];
      objsByCam[obj.camId].push(obj);
    });

    Object.entries(objsByCam).forEach(([camId, camObjs]) => {
      const camNode = newNodes.find(n => n.id === camId);
      if (camNode) {
        const objSpacing = 150;
        const objStartX = camNode.position.x - ((camObjs.length - 1) * objSpacing) / 2;
        
        camObjs.forEach((obj, idx) => {
          newNodes.push({
            id: obj.id,
            type: 'object',
            position: { x: objStartX + idx * objSpacing, y: 350 },
            data: { label: obj.label }
          });

          newEdges.push({
            id: `e-${camId}-${obj.id}`,
            source: camId,
            target: obj.id,
            style: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '5 5' }
          });
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [caseDetails, isTracking, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-zinc-950/50 rounded-xl border border-white/5 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-mono text-primary flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          KNOWLEDGE GRAPH
        </div>
      </div>
      
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No evidence available to build graph.
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          className="bg-transparent"
          minZoom={0.5}
          maxZoom={2}
        >
          <Background color="#ffffff" gap={16} size={1} className="opacity-5" />
          <Controls className="!bg-zinc-900 !border-white/10 !fill-white" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'subject') return 'hsl(var(--primary))';
              if (n.type === 'object') return '#f59e0b';
              if (n.type === 'location') return '#f43f5e';
              return '#71717a';
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
            className="!bg-zinc-950 !border-white/10"
          />
        </ReactFlow>
      )}
    </div>
  );
}
