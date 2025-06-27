const weaviate = require('weaviate-client').default;
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const rateLimit = require('express-rate-limit');

let client;
async function getWeaviateClient() {
  if (!client) {
    client = await weaviate.connectToLocal();
  }
  return client;
}

const embeddings = new OllamaEmbeddings({
  model: "all-minilm",
  baseUrl: "http://localhost:11434"
});

async function setupWeaviateSchema() {
  const client = await getWeaviateClient();
  const schemaRes = await client.schema.getter().do();
  const exists = schemaRes.classes && schemaRes.classes.some(c => c.class === "DisasterReport");
  if (exists) return;
  await client.schema
    .classCreator()
    .withClass({
      class: "DisasterReport",
      vectorizer: "none",
      properties: [
        { name: "reportId", dataType: ["string"] },
        { name: "location", dataType: ["string"] },
        { name: "disasterType", dataType: ["string"] },
        { name: "severityLevel", dataType: ["string"] },
        { name: "reportedAt", dataType: ["string"] },
        { name: "description", dataType: ["text"] },
      ],
    })
    .do();
}

async function upsertDisasterReportsToVectorStore(reports) {
  const client = await getWeaviateClient();
  const collection = client.collections.get('DisasterReport');
  for (const r of reports) {
    const vector = await embeddings.embedQuery(r.description);
    await collection.data.insert({
      reportId: r._id?.toString?.() || r.id,
      location: r.location,
      disasterType: r.disasterType,
      severityLevel: r.severityLevel,
      reportedAt: r.reportedAt,
      description: r.description,
      vector,
    });
  }
}

async function searchDisasterReports(query, topK = 5) {
  const client = await getWeaviateClient();
  const collection = client.collections.get('DisasterReport');
  const vector = await embeddings.embedQuery(query);
  const result = await collection.query.nearVector({
    vector,
    limit: topK,
  });
  return result.objects || [];
}

const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  max: 3, // 3 requests ต่อ window ต่อ IP
  message: 'คุณแจ้งรายงานบ่อยเกินไป กรุณารอสักครู่'
});

module.exports = {
  setupWeaviateSchema,
  upsertDisasterReportsToVectorStore,
  searchDisasterReports,
  reportLimiter,
};