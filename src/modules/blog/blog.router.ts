import { Router } from "express";
import { BlogController } from "./blog.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateBlogDTO } from "./dto/create-blog.dto";

export class BlogRouter {
  private router: Router;
  private blogController: BlogController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;
  constructor() {
    this.router = Router();
    this.blogController = new BlogController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.get("/", this.blogController.getBlogs);
    this.router.post(
      "/", //1
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!), // 2 
      this.uploaderMiddleware.upload().fields([{name: "thumbnail", maxCount: 1}]), // 3
      this.uploaderMiddleware.fileFilter(["image/jpeg", "image/png" , "image/avif", "image/webp"]), //4
      validateBody(CreateBlogDTO),
      this.blogController.createBlog // 5
    );
    this.router.get("/:slug", this.blogController.getBlogBySlug);
  };

  getRoutes = () => {
    return this.router;
  };
}
