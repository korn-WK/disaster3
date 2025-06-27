const ChatMessage = require('../models/ChatMessage');
const DisasterReport = require('../models/DisasterReport');
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");
const { LLMChain } = require("langchain/chains");
const { AgentExecutor, createOpenAIFunctionsAgent } = require("langchain/agents");
const fetch = require('node-fetch');
const { searchDisasterReports } = require('../services/vectorStoreService');

// Initialize the Ollama model
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "gemma3",
  temperature: 0.3,
  maxTokens: 1000,
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const groupReportsByProximity = (reports, maxDistance = 5) => {
  const groups = [];
  const processed = new Set();

  reports.forEach((report, i) => {
    if (processed.has(i)) return;

    const group = [report];
    processed.add(i);

    reports.forEach((otherReport, j) => {
      if (i === j || processed.has(j)) return;

      const distance = calculateDistance(
        report.locationCoordinates.lat,
        report.locationCoordinates.lng,
        otherReport.locationCoordinates.lat,
        otherReport.locationCoordinates.lng
      );

      if (distance <= maxDistance) {
        group.push(otherReport);
        processed.add(j);
      }
    });

    if (group.length > 0) {
      groups.push(group);
    }
  });

  return groups;
};

const formatReports = (reports) => {
  const reportGroups = groupReportsByProximity(reports);

  let formattedOutput = '';

  reportGroups.forEach((group, groupIndex) => {
    formattedOutput += `\nกลุ่มพื้นที่ที่ ${groupIndex + 1}:\n`;

    const centerLat = group.reduce((sum, r) => sum + r.locationCoordinates.lat, 0) / group.length;
    const centerLng = group.reduce((sum, r) => sum + r.locationCoordinates.lng, 0) / group.length;

    formattedOutput += `ตำแหน่งโดยประมาณ: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}\n`;
    formattedOutput += `จำนวนรายงานในพื้นที่: ${group.length}\n\n`;

    group.forEach((report, index) => {
      const reportDate = new Date(report.createdAt);
      formattedOutput += `รายงานที่ ${index + 1}:\n`;
      formattedOutput += `ประเภทภัยพิบัติ: ${report.disasterType}\n`;
      formattedOutput += `สถานที่: ${report.location}\n`;
      formattedOutput += `พิกัด: ${report.locationCoordinates.lat}, ${report.locationCoordinates.lng}\n`;
      formattedOutput += `รายละเอียด: ${report.description}\n`;
      formattedOutput += `ระดับความรุนแรง: ${report.severityLevel}\n`;
      formattedOutput += `เหตุผลการประเมินความรุนแรง: ${report.severityReasoning}\n`;
      formattedOutput += `เวลาที่รายงาน: ${reportDate.toLocaleString('th-TH')}\n`;
      formattedOutput += `ระยะเวลาผ่านไป: ${getTimeAgo(reportDate)}\n`;
      formattedOutput += '--------------------\n';
    });
  });

  return formattedOutput;
};

const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} วินาทีที่แล้ว`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  return `${Math.floor(diffInSeconds / 2592000)} เดือนที่แล้ว`;
};

const agents = {
  reader: {
    name: "reader_agent",
    description: "Expert in reading and summarizing disaster reports. Provides concise and complete answers.",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `You are a helpful assistant for summarizing disaster reports.
- Summarize the main events that happened recently.
- Use clear, concise, and friendly language (not too formal).
- Mention the location, main event, and key impacts.
- If there is no information, reply: "ไม่พบข้อมูลที่เกี่ยวข้อง"
- Answer in Thai language only.

Question: {question}

Disaster reports:
{reports}`,
        inputVariables: ["reports", "question"]
      });
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ reports: formatReports(reports), question });
      return result.text;
    }
  },
  location: {
    name: "location_agent",
    description: "Analyze disaster data by location and spatial relationships.",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `You are a helpful assistant for analyzing disaster data by location.
- Summarize the number of incidents and affected areas.
- Use simple, user-friendly language.
- Mention the area name, main event, and key impacts.
- If there is no information, reply: "ไม่พบข้อมูลที่เกี่ยวข้อง"
- Answer in Thai language only.

Question: {question}

Disaster reports:
{reports}`,
        inputVariables: ["reports", "question"]
      });
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ reports: formatReports(reports), question });
      return result.text;
    }
  },
  severity: {
    name: "severity_agent",
    description: "Analyze disaster data by severity and reasoning.",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `You are a helpful assistant for analyzing the severity of disasters.
- Summarize the most severe events and their main impacts.
- Use clear, user-friendly language.
- If there is no information, reply: "ไม่พบข้อมูลที่เกี่ยวข้อง"
- Answer in Thai language only.

Question: {question}

Disaster reports:
{reports}`,
        inputVariables: ["reports", "question"]
      });
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ reports: formatReports(reports), question });
      return result.text;
    }
  },
  type: {
    name: "type_agent",
    description: "Analyze disaster data by type.",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `You are a helpful assistant for analyzing disaster types.
- Summarize the most common disaster types and important events.
- Use clear, user-friendly language.
- If there is no information, reply: "ไม่พบข้อมูลที่เกี่ยวข้อง"
- Answer in Thai language only.

Question: {question}

Disaster reports:
{reports}`,
        inputVariables: ["reports", "question"]
      });
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({ reports: formatReports(reports), question });
      return result.text;
    }
  },
  summary: {
    name: "summary_agent",
    description: "Summarize and synthesize information from other agents into a coherent, comprehensive answer.",
    func: async (agentsResults, question) => {
      const prompt = new PromptTemplate({
        template: `You are a helpful assistant for summarizing disaster information from multiple experts.
- Summarize the information in a clear, concise, and friendly manner.
- Connect the information from each aspect without too much detail.
- If there is no information, reply: "ไม่พบข้อมูลที่เกี่ยวข้อง"
- Answer in Thai language only.

Question: {question}

Information from each expert:
[Summary]
{reader}

[Location Analysis]
{location}

[Severity Analysis]
{severity}

[Type Analysis]
{type}`,
        inputVariables: ["reader", "location", "severity", "type", "question"]
      });
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({
        reader: agentsResults.reader,
        location: agentsResults.location,
        severity: agentsResults.severity,
        type: agentsResults.type,
        question
      });
      return result.text;
    }
  }
};

const createMainAgent = async () => {
  const tools = Object.values(agents).map(agent => ({
    name: agent.name,
    description: agent.description,
    func: agent.func
  }));

  const prompt = new PromptTemplate({
    template: `คุณเป็นผู้ประสานงานในการวิเคราะห์ข้อมูลภัยพิบัติ
    หน้าที่ของคุณคือประสานงานกับผู้เชี่ยวชาญแต่ละด้านเพื่อตอบคำถามให้กระชับ ตรงประเด็น และมีข้อมูลครบถ้วน

    คำถาม: {question}

    ข้อมูลรายงานภัยพิบัติ:
    {reports}

    กรุณาประสานงานกับผู้เชี่ยวชาญเพื่อตอบคำถามให้กระชับและตรงประเด็น โดยพิจารณา:
    1. ถ้าคำถามเกี่ยวกับข้อมูลรายงาน ให้ใช้ reader_agent
    2. ถ้าคำถามเกี่ยวกับการวิเคราะห์แนวโน้ม ให้ใช้ location_agent
    3. ถ้าคำถามเกี่ยวกับความรุนแรง ให้ใช้ severity_agent
    4. ถ้าคำถามเกี่ยวกับประเภท ให้ใช้ type_agent
    5. ถ้าคำถามครอบคลุมหลายด้าน ให้ใช้หลาย agent ร่วมกัน

    {agent_scratchpad}`,
    inputVariables: ["reports", "question", "agent_scratchpad"]
  });

  return await createOpenAIFunctionsAgent({
    llm: model,
    tools: tools,
    prompt: prompt
  });
};

exports.getChatHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await ChatMessage.find({ userId }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
};

exports.sendMessage = async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing userId or message' });
  }

  try {
    const userMsg = new ChatMessage({ userId, role: 'user', text: message });
    await userMsg.save();

    const chatHistoryDocs = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const chatHistory = chatHistoryDocs.reverse();
    const chatHistoryText = chatHistory.map(msg => {
      const role = msg.role === 'user' ? 'ผู้ใช้' : 'AI';
      return `${role}: ${msg.text}`;
    }).join('\n');

    const disasterKeywords = [
      'ภัย', 'disaster', 'report', 'รายงาน',
      'น้ำท่วม', 'flood', 'ไฟไหม้', 'fire',
      'ดินถล่ม', 'landslide', 'พายุ', 'storm',
      'แผ่นดินไหว', 'earthquake', 'ภัยแล้ง', 'drought',
      'ภัยหนาว', 'cold', 'ภัยจากสารเคมี', 'chemical',
      'ภัยจากสัตว์', 'animal', 'อุบัติเหตุ', 'accident'
    ];

    const isDisasterQuestion = disasterKeywords.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    let aiResponse;
    const isReportOnly = message.includes('รายงาน') || message.includes('รายงานภัยพิบัติ');
    if (isReportOnly) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      let reports = await DisasterReport.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ createdAt: -1 });
      let filteredReports = reports;
      const lowerMsg = message.toLowerCase();
      // ถ้ามีคำว่า 'ล่าสุด' ให้เลือก 3 รายงานล่าสุด
      if (lowerMsg.includes('ล่าสุด')) {
        filteredReports = reports.slice(0, 3);
      } else {
        // ถ้ามีชื่อพื้นที่ ให้กรองตามพื้นที่
        const areaKeywords = ['เชียงใหม่', 'เชียงราย', 'กรุงเทพ', 'ขอนแก่น', 'นครราชสีมา', 'อุบล', 'สงขลา', 'ภูเก็ต', 'ชลบุรี', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'สุโขทัย', 'พิษณุโลก', 'นครสวรรค์', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ยะลา', 'ปัตตานี', 'นราธิวาส'];
        const foundArea = areaKeywords.find(area => lowerMsg.includes(area));
        if (foundArea) {
          filteredReports = reports.filter(r => r.location && r.location.includes(foundArea));
          filteredReports = filteredReports.slice(0, 5);
        } else {
          filteredReports = reports.slice(0, 10);
        }
      }
      // เลือก agent ตาม keyword
      let result = '';
      const locationKeywords = ['พื้นที่', 'จังหวัด', 'อำเภอ', 'ตำบล', 'lat', 'lng', 'location'];
      const severityKeywords = ['รุนแรง', 'severity', 'ระดับ', 'ความเสียหาย', 'เสียชีวิต', 'สูญหาย'];
      const typeKeywords = ['ประเภท', 'type', 'น้ำท่วม', 'ไฟไหม้', 'ดินถล่ม', 'พายุ', 'แผ่นดินไหว', 'ภัยแล้ง', 'ภัยหนาว', 'สารเคมี', 'สัตว์', 'อุบัติเหตุ', 'flood', 'fire', 'landslide', 'storm', 'earthquake', 'drought', 'cold', 'chemical', 'animal', 'accident'];
      if (locationKeywords.some(k => lowerMsg.includes(k))) {
        result = await agents.location.func(filteredReports, message);
      } else if (severityKeywords.some(k => lowerMsg.includes(k))) {
        result = await agents.severity.func(filteredReports, message);
      } else if (typeKeywords.some(k => lowerMsg.includes(k))) {
        result = await agents.type.func(filteredReports, message);
      } else {
        result = await agents.reader.func(filteredReports, message);
      }
      // แนบ chat history ใน response
      aiResponse = result;
    } else if (isDisasterQuestion) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);

      let reports = await DisasterReport.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ createdAt: -1 });

      let filteredReports = reports;
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('ล่าสุด')) {
        filteredReports = reports.slice(0, 3);
      } else {
        const areaKeywords = ['เชียงใหม่', 'เชียงราย', 'กรุงเทพ', 'ขอนแก่น', 'นครราชสีมา', 'อุบล', 'สงขลา', 'ภูเก็ต', 'ชลบุรี', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'สุโขทัย', 'พิษณุโลก', 'นครสวรรค์', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ยะลา', 'ปัตตานี', 'นราธิวาส'];
        const foundArea = areaKeywords.find(area => lowerMsg.includes(area));
        if (foundArea) {
          filteredReports = reports.filter(r => r.location && r.location.includes(foundArea));
          filteredReports = filteredReports.slice(0, 5);
        } else {
          filteredReports = reports.slice(0, 10);
        }
      }

      // Dynamic agent selection by keyword
      let semanticReports = [];
      if (isDisasterQuestion) {
        semanticReports = await searchDisasterReports(message, 5);
      }
      const readerResult = await agents.reader.func(semanticReports, message);
      let locationResult = "", severityResult = "", typeResult = "";
      const locationKeywords = ['พื้นที่', 'จังหวัด', 'อำเภอ', 'ตำบล', 'lat', 'lng', 'location'];
      const severityKeywords = ['รุนแรง', 'severity', 'ระดับ', 'ความเสียหาย', 'เสียชีวิต', 'สูญหาย'];
      const typeKeywords = ['ประเภท', 'type', 'น้ำท่วม', 'ไฟไหม้', 'ดินถล่ม', 'พายุ', 'แผ่นดินไหว', 'ภัยแล้ง', 'ภัยหนาว', 'สารเคมี', 'สัตว์', 'อุบัติเหตุ', 'flood', 'fire', 'landslide', 'storm', 'earthquake', 'drought', 'cold', 'chemical', 'animal', 'accident'];
      if (locationKeywords.some(k => lowerMsg.includes(k))) {
        locationResult = await agents.location.func(semanticReports, message);
      }
      if (severityKeywords.some(k => lowerMsg.includes(k))) {
        severityResult = await agents.severity.func(semanticReports, message);
      }
      if (typeKeywords.some(k => lowerMsg.includes(k))) {
        typeResult = await agents.type.func(semanticReports, message);
      }
      const summaryResult = await agents.summary.func({
        reader: readerResult,
        location: locationResult,
        severity: severityResult,
        type: typeResult
      }, message);
      // แนบ chat history ใน response
      aiResponse = summaryResult;
    } else {
      // แนบ chat history ใน prompt ที่ส่งไป Ollama
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3',
          prompt: `คุณเป็นผู้ช่วยที่ให้ข้อมูลทั่วไป\nคำถาม: ${message}\nกรุณาตอบคำถามให้กระชับ ตรงประเด็น และมีข้อมูลครบถ้วน`,
          stream: false
        })
      });
      const data = await response.json();
      aiResponse = data.response;
    }

    const aiMsg = new ChatMessage({ userId, role: 'ai', text: aiResponse });
    await aiMsg.save();

    res.json({ response: aiResponse });

  } catch {
    setChat([]); // ให้แชทว่าง ไม่แสดง error
  }
};