const fs = require("fs");
const AWS = require("aws-sdk");
const express = require("express");
const archiver = require("archiver");
const unzipper = require("unzipper");
const bodyParser = require("body-parser");
const DynamoBackup = require("dynamo-backup-to-s3");
const DynamoRestore = require("dynamo-backup-to-s3").Restore;

require("dotenv").config();

const { env } = require("./config");

const app = express();
const port = 3000;

// Use body-parser middleware
app.use(bodyParser.json());

// Configure AWS credentials
AWS.config.update({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB();
const s3BucketName = env.AWS_BUCKET_NAME;

app.post("/backup/table-list", async (req, res) => {
  try {
    // Iterate through the list of table names
    const tables = req.query.tables.split(",");

    // Create a new backup instance for each table
    const backup = new DynamoBackup({
      excludedTables: [tables],
      readPercentage: 0.5,
      bucket: s3BucketName,
      stopOnFailure: true,
      base64Binary: true,
      awsAccessKey: env.AWS_ACCESS_KEY_ID,
      awsSecretKey: env.AWS_SECRET_ACCESS_KEY,
      awsRegion: env.AWS_REGION,
    });

    console.log("-------------------");
    // Event listeners for backup progress and errors
    backup.on("error", function (data) {
      console.log("Error backing up " + data.table);
      console.log(data.err);
    });

    backup.on("start-backup", function (tableName, startTime) {
      console.log("Starting to copy table " + tableName);
      console.log(`Start time: ${startTime}`);
    });

    backup.on("end-backup", function (tableName, backupDuration) {
      console.log("Done copying table " + tableName);
      console.log(`Backup duration: ${backupDuration}`);
    });

    for (const table of tables) {
      // Check if the table exists
      const describeTableParams = { TableName: table };
      try {
        await dynamodb.describeTable(describeTableParams).promise();
        // Initiate the backup process
        backup.backupTable(table);
      } catch (error) {
        console.log(`Table ${table} does not exist`);
        continue;
      }
    }

    res.status(200).send("Backup copies to S3 completed successfully");
  } catch (error) {
    console.error("Error copying backups to S3:", error);
    res.status(500).send("An error occurred while copying backups to S3");
  }
});

app.post("/backup/table-all", async (req, res) => {
  try {
    // Create a new backup instance for all table
    const backup = new DynamoBackup({
      // excludedTables: [],
      readPercentage: 0.5,
      bucket: s3BucketName,
      stopOnFailure: true,
      base64Binary: true,
      awsAccessKey: env.AWS_ACCESS_KEY_ID,
      awsSecretKey: env.AWS_SECRET_ACCESS_KEY,
      awsRegion: env.AWS_REGION,
    });

    // Event listeners for backup progress and errors
    backup.on("error", function (data) {
      console.log("Error backing up " + data.table);
      console.log(data.err);
    });

    backup.on("start-backup", function (tableName, startTime) {
      console.log("Starting to copy table " + tableName);
      console.log(`Start time: ${startTime}`);
    });

    backup.on("end-backup", function (tableName, backupDuration) {
      console.log("Done copying table " + tableName);
      console.log(`Backup duration: ${backupDuration}`);
    });

    // Initiate the backup process
    backup.backupAllTables(function () {
      console.log("Finished backing up DynamoDB");
    });

    console.log("-------------------");

    res.status(200).send("Backup copies to S3 completed successfully");
  } catch (error) {
    console.error("Error copying backups to S3:", error);
    res.status(500).send("An error occurred while copying backups to S3");
  }
});

app.post("/restore/table-all", async (req, res) => {
  try {
    const s3Path = req.body.s3_path;

    // Get a list of all JSON files in the specified S3 bucket and path
    const s3 = new AWS.S3();
    const listObjectsParams = {
      Bucket: s3BucketName,
      Prefix: s3Path,
    };

    const s3Objects = await s3.listObjectsV2(listObjectsParams).promise();
    const jsonFiles = [];

    // Filter the JSON files in the top-level of the specified S3 path
    for (const object of s3Objects.Contents) {
      const isFile = !object.Key.endsWith("/");
      const isJSONFile = object.Key.endsWith(".json");
      if (isFile && isJSONFile) {
        jsonFiles.push(object);
      }
    }

    console.log({ jsonFiles });

    // Check if any JSON files are found
    if (jsonFiles.length === 0) {
      console.log("No JSON files found in the specified S3 path");
      return res
        .status(404)
        .send("No JSON files found in the specified S3 path");
    }

    // Restore each table from the JSON files
    for (const jsonFile of jsonFiles) {
      const table = jsonFile.Key.split("/")
        .pop() // Get the last part of the key (filename with extension)
        .replace(".json", "") // Remove the ".json" extension
        .replace(/-/g, "_") // Replace hyphens with underscores
        .toLowerCase() // Convert to lowercase
        .replace(/^dynamodb_backup_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_/, ""); // Remove the prefix

      console.log(table);
      // Output: table name

      const restore = new DynamoRestore({
        source: `s3://${s3BucketName}/${jsonFile.Key}`,
        table: table,
        overwrite: true,
        concurrency: 200,
        awsAccessKey: env.AWS_ACCESS_KEY_ID,
        awsSecretKey: env.AWS_SECRET_ACCESS_KEY,
        awsRegion: env.AWS_REGION,
      });

      // Event listeners for restore progress and errors
      restore.on("error", function (message) {
        console.log(message);
        process.exit(-1);
      });

      restore.on("warning", function (message) {
        console.log(message);
      });

      restore.on("send-batch", function (batches, requests, streamMeta) {
        console.log(
          "Batch sent. %d in flight. %d Mb remaining to download...",
          requests,
          streamMeta.RemainingLength / (1024 * 1024)
        );
      });

      // Initiate the restore process
      restore.run(function () {
        console.log("Finished restoring DynamoDB table:", table);
      });
    }

    res.status(200).send("Restore from S3 completed successfully");
  } catch (error) {
    console.error("Error restoring from S3:", error);
    res.status(500).send("An error occurred while restoring from S3");
  }
});

app.get("/bucket/download", async (req, res) => {
  try {
    const bucketName = req.query.bucket_name;

    // Create a new AWS S3 instance
    const s3 = new AWS.S3();

    // Get a list of all objects in the specified bucket
    const listObjectsParams = {
      Bucket: bucketName,
    };
    const s3Objects = await s3.listObjectsV2(listObjectsParams).promise();

    // Prepare a zip file to store the downloaded objects
    const archive = archiver("zip");
    res.attachment("bucket-download.zip");
    archive.pipe(res);

    // Iterate through each object and add it to the zip file
    for (const object of s3Objects.Contents) {
      const getObjectParams = {
        Bucket: bucketName,
        Key: object.Key,
      };
      const s3Object = await s3.getObject(getObjectParams).promise();
      archive.append(s3Object.Body, { name: object.Key });
    }

    // Finalize the zip file and send the response
    archive.finalize();
  } catch (error) {
    console.error("Error downloading bucket:", error);
    res.status(500).send("An error occurred while downloading the bucket");
  }
});

app.post("/bucket/upload", async (req, res) => {
  try {
    const bucketName = req.body.bucket_name;
    const zipFilePath = req.body.zip_file_path; // Path to the zip file on your server

    // Create a new AWS S3 instance
    const s3 = new AWS.S3();

    // Check if the bucket exists
    const headBucketParams = {
      Bucket: bucketName,
    };

    let bucketExists = true;

    try {
      await s3.headBucket(headBucketParams).promise();
    } catch (error) {
      if (error.code === "NoSuchBucket" || "NotFound") {
        bucketExists = false;
      } else {
        throw error;
      }
    }

    // If the bucket doesn't exist, create it
    if (!bucketExists) {
      const createBucketParams = {
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: s3.config.region,
        },
      };
      await s3.createBucket(createBucketParams).promise();
    }

    // Read the zip file from the local filesystem
    const zipFile = fs.createReadStream(zipFilePath);

    // Extract the contents of the zip file and upload them to the S3 bucket
    await zipFile
      .pipe(unzipper.Parse())
      .on("entry", async (entry) => {
        const fileName = entry.path;

        const uploadParams = {
          Bucket: bucketName,
          Key: fileName,
          Body: entry,
        };
        await s3.upload(uploadParams).promise();
      })
      .promise();

    res.status(200).send("Folder upload to S3 completed successfully");
  } catch (error) {
    console.error("Error uploading folder to S3:", error);
    res.status(500).send("An error occurred while uploading the folder to S3");
  }
});



app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
