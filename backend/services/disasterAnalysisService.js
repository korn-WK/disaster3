const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { Document } = require("@langchain/core/documents");
const { LLMChain } = require("langchain/chains");
const { PromptTemplate } = require("@langchain/core/prompts");
const { AgentExecutor, createOpenAIFunctionsAgent } = require("langchain/agents");
const { pull } = require("@langchain/core/runnables");
const DisasterReport = require("../models/DisasterReport");

// Initialize the Ollama model with optimized settings
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "gemma3",
  temperature: 0.3,
  maxTokens: 1000,
});

// Function to format reports for analysis
const formatReports = (reports) => {
  const limitedReports = reports.slice(0, 10);
  return limitedReports.map(report => 
    `ประเภทภัยพิบัติ: ${report.disasterType}
    สถานที่: ${report.location}
    รายละเอียด: ${report.description}
    เวลาที่รายงาน: ${report.reportedAt}
    --------------------`
  ).join('\n');
};

// Define specialized agents for different tasks
const agents = {
  reader: {
    name: "reader_agent",
    description: "อ่านและสรุปข้อมูลรายงานภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการอ่านและสรุปข้อมูลภัยพิบัติ
        หน้าที่ของคุณคืออ่านรายงานภัยพิบัติและตอบคำถามให้ตรงประเด็น

        คำถาม: {question}

        ข้อมูลรายงานภัยพิบัติ:
        {reports}

        กรุณาตอบคำถามให้กระชับและตรงประเด็น:`,
        inputVariables: ["reports", "question"]
      });

      const chain = new LLMChain({
        llm: model,
        prompt: prompt
      });

      const result = await chain.call({
        reports: formatReports(reports),
        question: question
      });

      return result.text;
    }
  },

  // Agent สำหรับวิเคราะห์แนวโน้ม
  analyzer: {
    name: "analyzer_agent",
    description: "วิเคราะห์แนวโน้มและรูปแบบของภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการวิเคราะห์แนวโน้มภัยพิบัติ
        หน้าที่ของคุณคือวิเคราะห์รูปแบบและแนวโน้มของภัยพิบัติ

        คำถาม: {question}

        ข้อมูลรายงานภัยพิบัติ:
        {reports}

        กรุณาวิเคราะห์และตอบคำถามให้กระชับ:`,
        inputVariables: ["reports", "question"]
      });

      const chain = new LLMChain({
        llm: model,
        prompt: prompt
      });

      const result = await chain.call({
        reports: formatReports(reports),
        question: question
      });

      return result.text;
    }
  },

  // Agent สำหรับให้คำแนะนำ
  advisor: {
    name: "advisor_agent",
    description: "ให้คำแนะนำในการป้องกันและรับมือกับภัยพิบัติ",
    func: async (reports, question) => {
      const prompt = new PromptTemplate({
        template: `คุณเป็นผู้เชี่ยวชาญในการให้คำแนะนำเกี่ยวกับภัยพิบัติ
        หน้าที่ของคุณคือให้คำแนะนำในการป้องกันและรับมือกับภัยพิบัติ

        คำถาม: {question}

        ข้อมูลรายงานภัยพิบัติ:
        {reports}

        กรุณาให้คำแนะนำที่กระชับและตรงประเด็น:`,
        inputVariables: ["reports", "question"]
      });

      const chain = new LLMChain({
        llm: model,
        prompt: prompt
      });

      const result = await chain.call({
        reports: formatReports(reports),
        question: question
      });

      return result.text;
    }
  }
};

// Create the main agent that coordinates other agents
const createMainAgent = async () => {
  const tools = Object.values(agents).map(agent => ({
    name: agent.name,
    description: agent.description,
    func: agent.func
  }));

  const prompt = new PromptTemplate({
    template: `คุณเป็นผู้ประสานงานในการวิเคราะห์ข้อมูลภัยพิบัติ
    หน้าที่ของคุณคือประสานงานกับผู้เชี่ยวชาญแต่ละด้านเพื่อตอบคำถามให้ตรงประเด็น

    คำถาม: {question}

    ข้อมูลรายงานภัยพิบัติ:
    {reports}

    กรุณาประสานงานกับผู้เชี่ยวชาญเพื่อตอบคำถามให้กระชับและตรงประเด็น:
    {agent_scratchpad}`,
    inputVariables: ["reports", "question", "agent_scratchpad"]
  });

  return await createOpenAIFunctionsAgent({
    llm: model,
    tools: tools,
    prompt: prompt
  });
};

// Main function to analyze disaster reports
exports.analyzeDisasterReports = async (timeRange = '7d', question = '') => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const reports = await DisasterReport.find({
      reportedAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ reportedAt: -1 }).limit(10);

    if (reports.length === 0) {
      return "ไม่พบรายงานภัยพิบัติในช่วงเวลาที่กำหนด";
    }

    const mainAgent = await createMainAgent();
    const agentExecutor = new AgentExecutor({
      agent: mainAgent,
      tools: Object.values(agents).map(agent => ({
        name: agent.name,
        description: agent.description,
        func: agent.func
      })),
      verbose: true
    });

    const result = await agentExecutor.invoke({
      reports: formatReports(reports),
      question: question
    });

    return result.output;
  } catch (error) {
    console.error('Error analyzing disaster reports:', error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อมูลได้');
  }
};

// Function to get specific insights about a disaster type
exports.getDisasterTypeInsights = async (disasterType, question = '') => {
  try {
    const reports = await DisasterReport.find({
      disasterType: disasterType
    }).sort({ reportedAt: -1 }).limit(10);

    if (reports.length === 0) {
      return `ไม่พบรายงานเกี่ยวกับภัยพิบัติประเภท ${disasterType}`;
    }

    const mainAgent = await createMainAgent();
    const agentExecutor = new AgentExecutor({
      agent: mainAgent,
      tools: Object.values(agents).map(agent => ({
        name: agent.name,
        description: agent.description,
        func: agent.func
      })),
      verbose: true
    });

    const result = await agentExecutor.invoke({
      reports: formatReports(reports),
      question: question
    });

    return result.output;
  } catch (error) {
    console.error('Error getting disaster type insights:', error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อมูลได้');
  }
}; 