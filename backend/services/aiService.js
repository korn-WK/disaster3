const { ChatOpenAI } = require("langchain/chat_models/openai");
const { Document } = require("langchain/document");
const { StuffDocumentsChain } = require("langchain/chains");

const model = new ChatOpenAI({
  temperature: 0.5,
  openAIApiKey: process.env.OPENAI_API_KEY
});

exports.analyzeReports = async (reports) => {
  const docs = reports.map((r) =>
    new Document({
      pageContent: `ประเภท: ${r.type}, จังหวัด: ${r.province}, เวลา: ${r.timestamp}, รายละเอียด: ${r.description}`,
      metadata: { id: r._id.toString() }
    })
  );

  const chain = StuffDocumentsChain.fromLLM(model);
  const response = await chain.call({ input_documents: docs });
  return response?.output_text || "ไม่พบการวิเคราะห์";
};
