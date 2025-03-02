const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
const dotenv = require("dotenv");



// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Initialize OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

http://localhost:8080/api/transcript/1

app.post("/convert-to-summary", async (req, res) => {
  console.log(req.body);
  try {
    const transcriptBodies = await Promise.all(req.body.transcript_ids.map(async (id) => {
      console.log(id);
      const response = await fetch(`http://localhost:8080/api/transcript/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch transcript with id ${id}`);
      }

      const data = await response.json();
      return data.data.body;
    }));

    const patientId = req.body.patientId;
    const mergedText = transcriptBodies.join('\n');

    const message = "Summarize into one paragraph:\n" + mergedText;
    console.log("Patient Id:");
    console.log(patientId);
    console.log("Merged Text:");
    console.log(mergedText);
    

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const gptResponse = response.choices[0].message.content;

    // Send GPT response to another server
    const summaryResponse = await fetch(`http://localhost:8080/api/summary/patient/${patientId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: gptResponse }),
    });

    if (!summaryResponse.ok) {
      throw new Error(`Failed to send summary for patient ${patientId}`);
    }

    res.json({ message: "Summary successfully sent", summary: gptResponse });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/convert-to-darp", async (req, res) => {
  console.log(req.body);
  try {
    const transcriptBodies = await Promise.all(req.body.transcript_ids.map(async (id) => {
      console.log(id);
      const response = await fetch(`http://localhost:8080/api/transcript/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch transcript with id ${id}`);
      }

      const data = await response.json();
      return data.data.body;
    }));

    const patientId = req.body.patientId;
    const mergedText = transcriptBodies.join('\n');

    const prompts = [
      { key: "data", message: "Summarize: \n\n" + mergedText },
      { key: "action", message: "What action can be done to address the symptoms? \n\n" + mergedText },
      { key: "response", message: "What action can be done to address the symptoms, and what would be the response? \n\n" + mergedText },
      { key: "plan", message: "What is the plan for addressing the symptom? \n\n" + mergedText },
    ];

    // Run all ChatGPT requests concurrently
    const responses = await Promise.all(
      prompts.map(async (prompt) => {
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt.message }],
          max_tokens: 1000,
          temperature: 0.7,
        });
        return { [prompt.key]: gptResponse.choices[0].message.content };
      })
    );

    // Combine responses into a single object
    const gptResponses = Object.assign({}, ...responses);

    // Send GPT responses to another server
    const summaryResponse = await fetch(`http://localhost:8080/api/DARP/patient/${patientId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gptResponses),
    });

    if (!summaryResponse.ok) {
      throw new Error(`Failed to send summary for patient ${patientId}`);
    }

    res.json({ message: "Summary successfully sent", summary: gptResponses });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/convert-to-head-to-toe", async (req, res) => {
  console.log(req.body);
  try {
    const transcriptBodies = await Promise.all(req.body.transcript_ids.map(async (id) => {
      console.log(id);
      const response = await fetch(`http://localhost:8080/api/transcript/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch transcript with id ${id}`);
      }

      const data = await response.json();
      return data.data.body;
    }));

    const patientId = req.body.patientId;
    const mergedText = transcriptBodies.join('\n');

    const promptRule = "Do not exceed three sentences. If there is no issue, say no symptom detected. \n\n"


    const prompts = [
      { key: "neurological", message: "highlight neurological of issue of a patient in text below." + promptRule+mergedText },
      { key: "HEENT", message: "highlight issue with Head, Eyes, Ears, Nose, Throat in text below. " + promptRule+mergedText },
      { key: "respiratory", message: "highlight respiratory of issue of a patient in text below." + promptRule+mergedText },
      { key: "cardiac", message: "highlight cardiac of issue of a patient in text below." + promptRule+mergedText },
      { key: "peripheral_Vascular", message: "highlight peripheral vascular of issue of a patient in text below." + promptRule+mergedText },
      { key: "integumentary", message: "highlight integumentary of issue of a patient in text below." + promptRule+mergedText },
      { key: "musculoskeletal", message: "highlight musculoskeletal of issue of a patient in text below." + promptRule+mergedText },
      { key: "gastrointestinal", message: " highlight gastrointestinal of issue of a patient in text below." + promptRule+mergedText },
      { key: "genitourinary", message: "highlight genitourinary of issue of a patient in text below." + promptRule+mergedText },
      { key: "sleep_Rest", message: "highlight sleep of issue of a patient in text below." + promptRule+mergedText },
      { key: "psychosocial", message: "highlight psychosocial of issue of a patient in text below." + promptRule+mergedText },
    ];

    // Run all ChatGPT requests concurrently
    const responses = await Promise.all(
      prompts.map(async (prompt) => {
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt.message }],
          max_tokens: 1000,
          temperature: 0.7,
        });
        return { [prompt.key]: gptResponse.choices[0].message.content };
      })
    );

    // Combine responses into a single object
    const gptResponses = Object.assign({}, ...responses);

    // Send GPT responses to another server
    const summaryResponse = await fetch(`http://localhost:8080/api/head-to-toe/patient/${patientId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gptResponses),
    });

    if (!summaryResponse.ok) {
      throw new Error(`Failed to send summary for patient ${patientId}`);
    }

    res.json({ message: "Summary successfully sent", summary: gptResponses });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});





// POST endpoint for OpenAI chat
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      max_tokens: 100,
      temperature: 0.7,
    });

    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET endpoint for patients
app.get("/patients", (req, res) => {
  const patients = [
    { id: 1, name: "Jae Kang", AHN: "xx-xx" },
    { id: 2, name: "Steven Au", AHN: "xx-xx" },
    { id: 3, name: "Maria Lopez", AHN: "xx-xx" },
  ];

  res.json(patients);
});

// GET endpoint for a patient's documents
app.get("/patient/:patientId", (req, res) => {
  const mockDocuments = [
    { id: 1, type: "Transcript", createdTime: "2024-02-27 12:00:00" },
    { id: 2, type: "Summary", createdTime: "2024-02-27 12:30:00" },
    { id: 3, type: "HeadToToe", createdTime: "2024-02-27 13:00:00" },
    { id: 4, type: "DARP", createdTime: "2024-02-27 14:00:00" },
  ];
  res.json(mockDocuments);
});

// GET endpoint for a transcript
app.get("/transcript/1", (req, res) => {
  res.json({
    patientName: "Loryn Sand",
    createdTime: "2024-02-27 12:00:00",
    body: "This is a transcript text.",
  });
});

// GET endpoint for a summary
app.get("/summary/:id", (req, res) => {
  res.json({
    patientName: "Jae",
    createdTime: "2024-02-27 12:30:00",
    body: "This is a summary text.",
  });
});

// GET endpoint for head-to-toe assessment
app.get("/head-to-toe/:id", (req, res) => {
  res.json({
    patientName: "Loryn Sand",
    createdTime: "2024-02-27 13:00:00",
    body: {
      neurological: "Normal",
      HEENT: "No abnormalities",
      respiratory: "Clear breath sounds",
      cardiac: "Regular heart rate and rhythm",
      peripheral_Vascular: "No edema",
      integumentary: "Intact skin",
      musculoskeletal: "Full range of motion",
      gastrointestinal: "Normal bowel sounds",
      genitourinary: "No abnormalities",
      sleep_Rest: "Adequate",
      psychosocial: "No distress",
    },
  });
});

// GET endpoint for DARP notes
app.get("/DARP/:id", (req, res) => {
  res.json({
    patientName: "Loryn Sand",
    createdTime: "2024-02-27 14:00:00",
    body: {
      data: "Patient reported pain",
      action: "Administered medication",
      response: "Pain relief observed",
      plan: "Monitor pain levels",
    },
  });
});



// ✅ Make sure this part exists! It starts the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


