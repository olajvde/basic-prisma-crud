import {PrismaClient} from "@prisma/client";
import express, {Request, Response, NextFunction} from "express";
const prisma = new PrismaClient();
import {body, validationResult} from "express-validator";
const app = express();
app.use(express.json());

const userValidationRules = [
  body("email")
    .isLength({min: 1})
    .withMessage("Please Enter Your Email")
    .isEmail()
    .withMessage("Must be a valid Email address"),

  body("name").isLength({min: 1}).withMessage("Please Enter a Name"),

  body("role")
    .isIn(["ADMIN", "USER", "SUPERADMIN", undefined])
    .withMessage(`Role must be one of 'ADMIN', 'USER', 'SUPERADMIN'`),
];

const postValidationRules = [
  body("title").isLength({min: 1}).withMessage("Please Enter a title"),
];

const simpleValidationResult = validationResult.withDefaults({
  formatter: (err) => err.msg,
});

const checkForErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = simpleValidationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.mapped());
  }
  next();
};

// Create users
app.post(
  "/create-user",
  userValidationRules,
  checkForErrors,
  async (req: Request, res: Response) => {
    const {name, email, role} = req.body;

    try {
      const existingUser = await prisma.user.findFirst({where: {email}});
      if (existingUser) throw {email: "User already registered"};

      const user = await prisma.user.create({
        data: {name, email, role},
      });
      return res.json(user);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error);
    }
  }
);

// Read users table
app.get("/get-users", async (_: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Something went wrong"});
  }
});

// Update user
app.put(
  "/update-user/:uuid",
  userValidationRules,
  checkForErrors,
  async (req: Request, res: Response) => {
    const {name, email, role} = req.body;
    const uuid = req.params.uuid;
    try {
      let user = await prisma.user.findFirst({where: {uuid}});
      if (!user) throw {user: "User not found"};

      user = await prisma.user.update({
        where: {uuid},
        data: {name, email, role},
      });
      return res.json(user);
    } catch (error) {
      console.log(error);
      return res.status(404).json(error);
    }
  }
);

// Delete USer
app.get("/delete-user/:uuid", async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({where: {uuid: req.params.uuid}});
    return res.json({message: "User Deleted"});
  } catch (error) {
    return res.status(404).json(error);
  }
});

// Find a user
app.get("/find-user/:uuid", async (req: Request, res: Response) => {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {uuid: req.params.uuid},
    });
    return res.json(existingUser);
  } catch (error) {
    return res.status(404).json({user: "User not found"});
  }
});

//Create a Post
app.post(
  "/create-post",
  postValidationRules,
  checkForErrors,
  async (req: Request, res: Response) => {
    const {title, body, userUuid} = req.body;

    try {
      const post = await prisma.post.create({
        data: {title, body, user: {connect: {uuid: userUuid}}},
      });
      return res.json(post);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error);
    }
  }
);

// Read all posts
app.get("/get-posts", async (_: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {createdAt: "desc"},
      include: {user: true},
    });
    return res.json(posts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({error: "Something went wrong"});
  }
});

app.listen(5000, () => console.log("Server running at port 5000"));
