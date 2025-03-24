/**
 * Generates RFP-style summaries about how Datadog can handle various topics.
 * Reads from Column B (2) for the topic, writes the response to Column C (3).
 * 
 * Usage:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into the editor, replacing any placeholders.
 * 4. Update SHEET_NAME, START_ROW, COL_TOPIC, COL_RESPONSE if needed.
 * 5. Replace "YOUR_OPENAI_API_KEY" with your actual OpenAI API key.
 * 6. Save, then click 'Run' > 'getOpenAIResponses' in the Apps Script toolbar.
 */

function getOpenAIResponses() {
  // ---- CONFIGURATION SECTION ----
  const SHEET_NAME = "Test - APM Tool Technical Requirement";       // Change to your actual sheet name
  const START_ROW = 2;               // Row to start processing (assuming row 1 is header)
  const COL_TOPIC = 2;               // Column index for the topic/prompt input (B = 2)
  const COL_RESPONSE = 11;            // Column index to write the response (C = 3)
  
  // OpenAI API Configuration
  const OPENAI_API_KEY = <openapi-key>;
  const MODEL = "gpt-4";     // ChatGPT model

  // Prompt scaffolding
  const promptPrefix = "Summarize how Datadog can ";
  const promptSuffix = 
    ". Provide no more than 500 words and include reference links from Datadoghq’s " + 
    "official documentation (https://docs.datadoghq.com/), https://www.datadoghq.com/blog/ and GitHub. " +
    "Tailor the tone and structure for an RFP response.";
  
  // ---- END CONFIGURATION SECTION ----

  // Retrieve the sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log(`Sheet "${SHEET_NAME}" not found. Please check your configuration.`);
    return;
  }

  // Determine the last row with data in it
  const lastRow = sheet.getLastRow();

  // Loop through each row, starting at START_ROW
  for (let row = START_ROW; row <= lastRow; row++) {
    const topicCell = sheet.getRange(row, COL_TOPIC);
    const topicValue = topicCell.getValue();
    
    // Skip if there's no topic in the cell
    if (!topicValue || topicValue.toString().trim() === "") {
      continue;
    }

    // Construct the prompt for ChatGPT
    const prompt = promptPrefix + topicValue + promptSuffix;

    // Prepare the ChatGPT request payload
    const requestBody = {
      model: MODEL,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,         // Adjust tokens as needed; 1000 is usually safe for ~500 words
      temperature: 0.7
    };

    const options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    try {
      // Make the API request
      const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
      const jsonResponse = JSON.parse(response.getContentText());

      // Extract the AI-generated content
      const aiMessage = jsonResponse.choices && jsonResponse.choices.length > 0 
        ? jsonResponse.choices[0].message.content 
        : "No response generated.";

      // Write the response back to the sheet (Column C, for example)
      sheet.getRange(row, COL_RESPONSE).setValue(aiMessage);

      Logger.log(`Row ${row} processed successfully.`);
    } catch (error) {
      // Log any errors
      Logger.log(`Error at row ${row}: ${error}`);
      sheet.getRange(row, COL_RESPONSE).setValue("Error generating response.");
    }
  }
}
