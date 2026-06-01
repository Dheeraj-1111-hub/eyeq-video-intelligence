import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/agent/chat', {
      messages: [{ role: 'user', content: 'hello' }]
    }, {
      headers: { Authorization: 'Bearer test' }
    });
    console.log("Status:", res.status);
    console.log("Data:", res.data);
  } catch (e) {
    console.log("Error status:", e.response?.status);
    console.log("Error data:", e.response?.data);
  }
}
test();
