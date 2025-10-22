// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const cohortgptIndex = pc.Index('chatgpt-test');

async function createMemory({vectors, metadata, messageId}) {
    // Ensure vectors is an array
    // const vectorArray = Array.isArray(vectors) ? vectors : [vectors];
    await cohortgptIndex.upsert([{
    //       vectors: [
    //   {
        id: messageId.toString(),
        values: vectors,   // keep as flat array
        metadata
    //   }
    // ]
    }])
}

async function queryMemory({queryVectors, limit = 5, metadata}){
    // Ensure queryVectors is an array
    // const vectorArray = Array.isArray(queryVectors) ? queryVectors : [queryVectors];
    const data = await cohortgptIndex.query({
        vector: queryVectors,
        topK: limit,
        filter: metadata ?  metadata  : undefined,
        includeMetadata: true
    })

    return data.matches;
}

module.exports = {
    createMemory,
    queryMemory
};