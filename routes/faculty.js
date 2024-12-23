import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import db from "../models/database.js";

const router = express.Router();
const saltRounds = 15;

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/login", async (req, res) => {
    const {username, password} = req.body;

    try {
        const response = await db.query("SELECT PASSWORDHASH FROM FACULTIES WHERE USERNAME = $1",
            [username],
        );

        if (response.rowCount == 0) {
            res.status(404).json({
                error: "user does not exist",
            });
        } else {
            const hashedPassword = response.rows[0].passwordhash;
            const passwordMatch = await bcrypt.compare(password, hashedPassword);
            res.json({
                match: passwordMatch,
            });
        }
    } catch(err) {
        console.log(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.get("/session", async (req, res) => {
    const {username, time, date} = req.body;
    const sessionDate = new Date(date);

    try {
        const response = await db.query("SELECT ISBOOKED FROM SESSIONS WHERE FACULTYID = (SELECT FACULTYID FROM FACULTIES WHERE USERNAME = $1) AND SESSIONTIME = $2 AND SESSIONDATE = $3",
            [username, time, sessionDate],
        );

        if (response.rowCount == 0) {
            res.status(404).json({
                error: "session not found",
            });
        } else {
            res.json({
                data: response.rows,
            });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.post("/session", async (req, res) => {
    const {username, time, date} = req.body;
    const sessionDate = new Date(date);

    try {
        await db.query("INSERT INTO SESSIONS (FACULTYID, SESSIONTIME, SESSIONDATE) VALUES ((SELECT FACULTYID FROM FACULTIES WHERE USERNAME = $1), $2, $3)",
            [username, time, sessionDate],
        );
        res.json({
            message: "success",
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.delete("/session", async (req, res) => {
    const {username, time, date} = req.body;
    const sessionDate = new Date(date);

    try {
        await db.query("DELETE FROM SESSIONS WHERE FACULTYID = (SELECT FACULTYID FROM FACULTIES WHERE USERNAME = $1) AND SESSIONTIME = $2 AND SESSIONDATE = $3",
            [username, time, sessionDate],
        );
        res.json({
            message: "success",
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
})

router.get("/:username", async (req, res) => {
    const username = req.params.username;

    try {
        const response = await db.query("SELECT USERNAME, NAME, SUBJECT FROM FACULTIES WHERE USERNAME = $1", 
            [username]);
        res.json({
            count: response.rowCount,
            data: response.rows,
        });
    } catch (err) {
        console.log(err.messsage);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.post("/", async (req, res) => {
    const {username, name, password, subject} = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        await db.query("INSERT INTO FACULTIES (USERNAME, PASSWORDHASH, NAME, SUBJECT) VALUES ($1, $2, $3, $4)",
            [username, hashedPassword, name, subject],
        );
        res.json({
            message: "success",
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.delete("/:username", async (req, res) => {
    const username = req.params.username;
    
    try {
        await db.query("DELETE FROM FACULTIES WHERE USERNAME = $1",
            [username],
        );
        res.json({
            message: "success",
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
});

export default router;