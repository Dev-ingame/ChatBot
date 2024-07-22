const brain = require("brain.js");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const datasetPath = path.join(__dirname, "dataset.json");
const trainedDataPath = path.join(__dirname, "trainedData.json");
const bestTrainedDataPath = path.join(__dirname, "bestTrainedData.json");

const preprocessData = (data) => {
    return data.map((item) => {
        const input = item.input.toLowerCase().replace(/[^\w\s]/gi, "");
        const output = item.output;
        return { input, output };
    });
};

const readJSONFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        if (data) {
            return JSON.parse(data);
        } else {
            console.warn(`${filePath} is empty.`);
            return [];
        }
    } catch (error) {
        console.error(`Error reading or parsing ${filePath}:`, error);
        return [];
    }
};

const writeJSONFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing to ${filePath}:`, error);
    }
};
const getFloats = (str) => {
    return str.match(/\d+(?:\.\d+)?/g).map(parseFloat);
  }

const rawData = readJSONFile(datasetPath);
const trainingData = preprocessData(rawData);

const net = new brain.recurrent.LSTM();

const trainNetwork = () => {
    let bestAccuracy = Infinity;
    let bestNetwork;

    const bestTrainedData = readJSONFile(trainedDataPath );
    if (bestTrainedData) {
        net.fromJSON(bestTrainedData);
        bestNetwork = net.toJSON();
    }

    net.train(trainingData, {
        iterations: 1000,
        log: (status) => {
            console.log(status);
            let Accuracy = getFloats(status)
            if (Accuracy < bestAccuracy) {
                bestAccuracy = getFloats(status)
                bestNetwork = net.toJSON();
            } else {
                // console.log(Accuracy)
            }
        },
        logPeriod: 10,
    });

    writeJSONFile(bestTrainedDataPath, bestNetwork);
    writeJSONFile(trainedDataPath, net.toJSON());
};

const trainedData = readJSONFile(trainedDataPath);
net.fromJSON(trainedData);
// if (trainedData.length) {

// } else {
//     trainNetwork();
// }

const addOrUpdateTrainingData = (input, output) => {
    const lowerCaseInput = input.toLowerCase().replace(/[^\w\s]/gi, "");
    const existingEntryIndex = rawData.findIndex(
        (item) => item.input.toLowerCase() === lowerCaseInput
    );

    if (existingEntryIndex !== -1) {
        rawData[existingEntryIndex].output = output;
    } else {
        rawData.push({ input, output });
    }

    writeJSONFile(datasetPath, rawData);
    trainNetwork();
};

const app = express();
app.use(bodyParser.json());

app.use(express.static("public"));

app.post("/api/chat/retrain", (req, res) => {
    trainNetwork();
    res.json({
        message: "bot retrained",
    });
});

app.post("/api/chat", (req, res) => {
    const userMessage = req.body.message;
    const preprocessedInput = userMessage
        .toLowerCase()
        .replace(/[^\w\s]/gi, "");
    const output = net.run(preprocessedInput);
    res.json({ response: output });
});

app.post("/api/feedback", (req, res) => {
    const { input, correctResponse } = req.body;
    addOrUpdateTrainingData(input, correctResponse);
    res.json({
        message: "Thank you for your feedback! The model has been updated.",
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
