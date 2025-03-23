import express from "express";
import bodyParser from "body-parser";
import fs from "fs/promises";


const DATA_FILE = "blogPosts.json";
const app = express();
const port = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));


let blogPosts = [];
(async () => {
    try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        blogPosts = data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading JSON file:", error);
        blogPosts = [];
    }
})();


app.get("/", (req, res) => {
    res.render("index.ejs", { blogPosts });
});

app.get("/submit", (req, res) => {
    res.render("new_post.ejs");
});


app.post("/submit", async (req, res) => {
    const { title, blog } = req.body;

    if (!title || !blog || title.trim() === "" || blog.trim() === "") {
        return res.status(400).json({ message: "Title and blog content are required." });
    }

    let newPost;
    do {
        newPost = { id: Date.now(), title, blog };
    } while (blogPosts.some(post => post.id === newPost.id));

    blogPosts.push(newPost);

    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(blogPosts, null, 2), "utf-8");
        res.status(200).json({ message: "Blog posted successfully", newPost });
    } catch (error) {
        console.error("Error writing to JSON file:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/post/:id", (req, res) => {
    const postId = parseInt(req.params.id);
    const post = blogPosts.find((p) => p.id === postId);

    if (!post) {
        return res.status(404).send("Post not found");
    }

    res.render("post.ejs", { post });
});


app.delete("/delete/:id", async (req, res) => {
    const postId = parseInt(req.params.id);
    const index = blogPosts.findIndex((p) => p.id === postId);

    if (index === -1) {
        return res.status(404).json({ message: "Post not found" });
    }

    blogPosts.splice(index, 1);

    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(blogPosts, null, 2), "utf-8");
        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error writing to JSON file:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});