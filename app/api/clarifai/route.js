export async function POST(req) {
  try {
    const { base64 } = await req.json();

    const response = await fetch(
      `https://api.clarifai.com/v2/users/clarifai/apps/main/models/apparel-classification-v2/versions/651c5412d53c408fa3b4fe3dcc060be7/outputs`,
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${process.env.CLARIFAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: [{ data: { image: { base64 } } }] }),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error("Error API Route:", err);
    return new Response(JSON.stringify({ error: "Error al analizar la foto" }), { status: 500 });
  }
}