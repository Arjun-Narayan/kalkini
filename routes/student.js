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
        const response = await db.query("SELECT PASSWORDHASH FROM STUDENTS WHERE USERNAME = $1",
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
    const subject = req.body.subject.toUpperCase();
    try {
        const response = await db.query("SELECT FACULTIES.USERNAME, SESSIONTIME, SESSIONDATE, ISBOOKED FROM SESSIONS INNER JOIN FACULTIES ON SESSIONS.FACULTYID = FACULTIES.FACULTYID WHERE FACULTIES.SUBJECT = $1",
            [subject],
        );

        var data = response.rows;
        data.forEach((element, index) => {
            const date = element.sessiondate.toISOString().split("T")[0];
            data[index].sessiondate = date;
        });

        res.json({
            count: response.rowCount,
            data: response.rows,
        });
    } catch (err) {
        console.log(err.message);
        res.json({
            error: err.message,
        });
    }
});

router.post("/session", async (req, res) => {
    const {username, faculty, time, date} = req.body;
    const sessionDate = new Date(date);

    try {
        const response = await db.query("SELECT ISBOOKED FROM SESSIONS WHERE FACULTYID = (SELECT FACULTYID FROM FACULTIES WHERE USERNAME = $1) AND SESSIONTIME = $2 AND SESSIONDATE = $3",
            [faculty, time, sessionDate],
        );
        console.log(response);
        if (response.rows[0].isbooked == true) {
            res.json({
                error: "session already booked",
            });
        } else {
            await db.query("INSERT INTO BOOKINGS (STUDENTID, SESSIONID) VALUES ((SELECT STUDENTID FROM STUDENTS WHERE USERNAME = $1), (SELECT SESSIONID FROM SESSIONS WHERE FACULTYID = (SELECT FACULTYID FROM FACULTIES WHERE USERNAME = $2) AND SESSIONTIME = $3 AND SESSIONDATE = $4))",
                [username, faculty, time, sessionDate],
            );
            res.json({
                message: "success",
            });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({
            error: err.message,
        });
    }
});

router.delete("/session", async (req, res) => {
    const {username, faculty, time, date} = req.body;
    const sessionDate = new Date(date);

    try {
        await db.query("DELETE FROM BOOKINGS WHERE STUDENTID = (SELECT STUDENTID FROM STUDENTS WHERE USERNAME = $1) AND SESSIONID = (SELECT SESSIONID FROM SESSIONS WHERE FACULTYID = (SELECT FACULTYID FROM FACULTIES WHERE USERNAME = $2) AND SESSIONTIME = $3 AND SESSIONDATE = $4)",
            [username, faculty, time, sessionDate],
        );
        res.json({
            message: "success",
        });
    } catch (err) {
        console.log(err.message);
        res.json({
            error: err.message,
        });
    }
});

router.get("/session/:username", async (req, res) => {
    const username = req.params.username;

    try {
        const response = await db.query("SELECT FACULTIES.NAME, FACULTY.SUBJECT, SESSIONS.SESSIONTIME, SESSIONS.SESSIONDATE FROM BOOKINGS INNER JOIN SESSIONS ON BOOKINGS.SESSIONID = SESSIONS.SESSIONID INNER JOIN FACULTIES ON SESSIONS.FACULTYID = FACULTIES.FACULTYID INNER JOIN STUDENTS ON BOOKINGS.STUDENTID = STUDENTS.STUDENTID WHERE STUDENTS.USERNAME = $1",
            [username],
        );
        if (response.rowCount == 0) {
            res.status(404).json({
                error: "session not found",
            });
        } else {
            res.json({
                 count: response.rowCount,
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

router.get("/:username", async (req, res) => {
    const username = req.params.username;

    try {
        const response = await db.query("SELECT USERNAME, NAME FROM STUDENTS WHERE USERNAME = $1", 
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
    const {username, name, password} = req.body;
    const hashedPassword = bcrypt.hash(password, saltRounds);

    try {
        await db.query("INSERT INTO STUDENTS (USERNAME, PASSWORDHASH, NAME) VALUES ($1, $2, $3)",
            [username, hashedPassword, name],
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
        await db.query("DELETE FROM STUDENTS WHERE USERNAME = $1",
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