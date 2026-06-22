# EduCast
Web-application for education podcasts
## Solved Problems \& Relevance of The Project
In spite of the wide availability of digital educational resources, existing platforms such as video hosting services, online course platforms, and knowledge-sharing communities have several limitations in the context of efficient academic learning:
  - not specialized in the educational process. They contain a significant amount of unrelated or distracting content like entertaining videos, advertisements, or non-academic materials. It increases cognitive load and reduces learning efficiency. As a result, students often spend a lot of time to searching for relevant information instead of engaging in focused learning;
  - primarily rely on video-based content. While videos are effective for in-depth explanations, they are often time-consuming and not suitable for quick revision or fast exam preparation;
  - high barrier to entry to load a content. Recording, editing, and uploading video content requires time, effort, and technical skills, which hinders students from contributing their own explanations and knowledge;
  - limited support for peer-to-peer knowledge. Exchange within a specific academic context (e.g., between students of the same course or institution). Content is often generalized and not tailored to specific instructors, curricula, or exam formats.

The EduCast addresses these limitations by introducing a platform focused exclusively on short, student-generated audio content for academic purposes. Audio format enables faster content consumption and supports multitasking, making it particularly suitable for revision scenarios. The simplified upload process, including Telegram bot integration, significantly lowers the barrier for content creation, encouraging active participation. 
Furthermore, the integration of machine learning techniques (such as speech-to-text processing, automatic tagging, and recommendation systems) improves content discoverability and personalization, allowing users to efficiently find relevant materials. 
Thus, the development of this platform is justified by the need for a more focused, accessible, and efficient educational tool that supports quick knowledge transfer, peer learning, and active student engagement.

## Chosen Tech Stack \& Justification
For MVP of EduCast project the following technology stack was selected:
  - Java 21 + Spring Boot. Spring Boot is used as the main backend framework due to its robustness, scalability, and wide industry adoption. It provides a well-structured architecture for building RESTful APIs and simplifies configuration through auto-configuration features, which accelerates development.
 - Spring Data JPA + Hibernate. These technologies are used for database interaction. Hibernate acts as an ORM tool, allowing developers to work with database entities as Java objects. Spring Data JPA simplifies data access by reducing boilerplate code and providing ready-to-use repository abstractions.
 - Spring Security + JWT. Used for authentication and authorization. Spring Security provides a secure and flexible way to protect endpoints, while JSON Web Tokens enables stateless authentication, which is suitable for scalable web applications.
 - PosgreSQL. Chosen as the primary database management system due to its reliability, extensibility, and support for complex queries. Its support for indexing and full-text search can also improve search performance within the platform. 
 - Node.js 20+. Node.js is used to build the frontend, enabling dynamic interaction with the backend API. It allows efficient handling of asynchronous operations and supports modern JavaScript-based development.
 - Docker. Docker is used to containerize both backend and database services. This ensures consistent environments across development and deployment, simplifies setup on the provided VM, and satisfies reproducibility requirements.
 - SMTP. Used for sending emails. This improves user experience and supports basic account management features.
