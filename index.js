import express from "express";
import morgan from "morgan";
import studentRouter from "./routes/student.js";
import facultyRouter from "./routes/faculty.js";

const app = express();
const port = 3000;

app.listen(port, () => {
    console.log("Server running on port " + port);
});

app.use(morgan("dev"));

app.use("/student", studentRouter);
app.use("/faculty", facultyRouter);

app.use((req, res) => {
    res.sendStatus(404).json({
        error: "invalid path",
    });
});