# ProjectMan

> 🚀 **ProjectMan** is a Visual Studio Code extension designed to centralize, organize, and manage your development projects directly from VS Code, regardless of where those projects are physically stored on your computer.

[![Visual Studio Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC?logo=visual-studio-code&logoColor=white)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📌 Overview

Developers often have projects distributed across many folders such as `Documents`, `Downloads`, `Desktop`, `Projects`, `Work`, `WordPress`, or other custom directories. Finding and opening these projects repeatedly can become tedious.

**ProjectMan** solves this problem by allowing you to keep a centralized list of your projects inside Visual Studio Code.

With ProjectMan, you can register projects from any location, organize them in one place, open them instantly, create new projects, and remove projects from your ProjectMan list without having to remember their physical location.

> **One place. All your projects.**

---

## 🎥 Demo

Watch the following video to see ProjectMan in action:

<!-- Replace this URL with your demo video -->

[![ProjectMan Demo](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

> 💡 Replace `VIDEO_ID` with the ID of your YouTube demonstration video.

---

## ✨ Main Features

### 📂 Centralized project management

Manage projects located in completely different folders or drives from a single interface inside VS Code.

### ➕ Add existing projects

Register an existing project by selecting its folder. ProjectMan stores the project reference so you can access it later without searching for the folder manually.

### 🚀 Open projects instantly

Open a registered project directly from ProjectMan with a single action.

### 🗑️ Remove projects

Remove a project from your ProjectMan list when it is no longer needed.

> Removing a project from ProjectMan does not necessarily mean deleting its files from your computer. Always confirm the action shown by the extension before deleting files.

### 🆕 Create blank projects

Create a new empty project from ProjectMan and choose where the project should be stored.

### ⌨️ Command support

Use Visual Studio Code commands to perform ProjectMan actions without manually navigating through the interface.

### 🧭 Access projects regardless of their location

Your projects can live in different locations, for example:

```text
C:\Users\User\Documents\Projects
C:\Users\User\Downloads
C:\Users\User\Desktop\Work
D:\Projects
D:\WordPress
```

ProjectMan gives you one centralized place to access them.

---

## 🎯 Why ProjectMan?

Without a project manager, developers may need to:

1. Remember where each project is located.
2. Navigate through multiple folders.
3. Find the correct project manually.
4. Open the project in VS Code.
5. Repeat the process every time they switch projects.

With ProjectMan, the workflow becomes simpler:

```text
ProjectMan
   ↓
Select Project
   ↓
Open
   ↓
Start Working
```

This makes switching between projects faster and keeps your development workspace more organized.

---

## 📦 Installation

### Install from the Visual Studio Code Marketplace

1. Open **Visual Studio Code**.
2. Open the **Extensions** view with `Ctrl + Shift + X`.
3. Search for **ProjectMan**.
4. Select the extension.
5. Click **Install**.

### Install from a VSIX package

If you have a `.vsix` file:

1. Open Visual Studio Code.
2. Open the Extensions panel.
3. Select the `...` menu.
4. Choose **Install from VSIX...**.
5. Select the ProjectMan `.vsix` file.

---

## 🚀 Getting Started

After installing ProjectMan, open Visual Studio Code and access the extension from its dedicated view or command interface.

The exact location may depend on the version of the extension and the UI configuration of VS Code.

A typical workflow is:

```text
Install ProjectMan
       ↓
Open ProjectMan
       ↓
Add or Create a Project
       ↓
Select a Project
       ↓
Open and Work
```

---

## 📂 How to Add an Existing Project

Use this option when you already have a project on your computer.

### Steps

1. Open **ProjectMan**.
2. Select **Add Project**.
3. Choose the folder that contains your project.
4. Confirm the selection.
5. The project will appear in your ProjectMan project list.
6. Click the project whenever you want to open it.

For example, you could register projects stored in:

```text
Documents/MyApp
Downloads/TestProject
Desktop/ClientWebsite
D:/Projects/ApiBackend
D:/WordPress/MyWebsite
```

After registering them, you no longer need to remember their exact locations to open them from ProjectMan.

---

## 🆕 How to Create a Blank Project

ProjectMan can also help you start a new project from an empty directory.

### Typical workflow

1. Open **ProjectMan**.
2. Select the option to create a new project.
3. Enter the project name.
4. Select the destination folder.
5. Create the project.
6. The new project becomes available from your ProjectMan list.

Example:

```text
Create Project
      ↓
My-New-Project
      ↓
Select Location
      ↓
Create
      ↓
ProjectMan
```

> The exact behavior of project initialization depends on how your extension implements project creation.

---

## ⚡ Open a Project Instantly

One of the main purposes of ProjectMan is to make opening projects fast.

Instead of browsing through folders manually:

```text
Documents
   └── Work
       └── Projects
           └── MyProject
```

You can simply open ProjectMan and select `MyProject`.

This is especially useful when you work on many projects located in different directories.

---

## 🗑️ Removing a Project

When a project is no longer relevant, you can remove it from your ProjectMan list.

### Remove from ProjectMan

Select the project and use the remove/delete action provided by the extension.

Depending on the implemented behavior, ProjectMan may either:

- Remove only the project registration from ProjectMan.
- Ask whether the project files should also be deleted.

Always verify the confirmation dialog before performing destructive actions.

---

## ⌨️ Using Commands

ProjectMan can be used through the Visual Studio Code Command Palette.

Open the Command Palette with:

```text
Ctrl + Shift + P
```

Then search for commands related to **ProjectMan**.

Examples of possible actions include:

```text
ProjectMan: Add Project
ProjectMan: Create Project
ProjectMan: Open Project
ProjectMan: Remove Project
```

> Update this list to match the exact command names registered in the current version of the extension.

---

## 🧩 Supported Workflow

ProjectMan is useful for developers who work with multiple types of projects, such as:

- Web applications
- APIs and backend services
- Frontend projects
- Laravel projects
- .NET projects
- Node.js projects
- React applications
- Angular applications
- Vue applications
- WordPress projects
- Mobile applications
- Personal projects
- University projects
- Client projects

ProjectMan does not need every project to be inside the same parent directory. The projects can be distributed across different folders and drives.

---

## 🗂️ Example

Imagine that you have the following projects:

```text
C:\Users\User\Documents\ERP-System
C:\Users\User\Downloads\LandingPage
C:\Users\User\Desktop\ClientApp
D:\Projects\API
D:\WordPress\MyWebsite
```

Normally, you would have to remember all those locations.

With ProjectMan, they can be registered in one place:

```text
┌──────────────────────────────┐
│          ProjectMan          │
├──────────────────────────────┤
│ ERP-System                   │
│ LandingPage                  │
│ ClientApp                    │
│ API                          │
│ MyWebsite                    │
└──────────────────────────────┘
```

Select a project and open it directly.

---

## 🔐 Project Paths and Data

ProjectMan uses the location of each project to know where the project exists on your computer.

For example:

```text
Project Name: My API
Location: D:\Projects\MyAPI
```

The extension can use this information to provide quick access to the project from VS Code.

> Describe here exactly where your current implementation stores project information, such as VS Code settings, extension storage, a JSON file, or another persistence mechanism.

---

## 🛠️ Technologies

ProjectMan is built as a Visual Studio Code extension.

Typical technologies used in an extension project include:

- Visual Studio Code Extension API
- TypeScript / JavaScript
- Node.js
- VS Code Commands API
- VS Code Workspace API

Update this section according to the exact technologies and libraries used in your implementation.

---

## 📁 Suggested Project Structure

A typical VS Code extension project may look like this:

```text
ProjectMan/
├── src/
│   ├── extension.ts
│   ├── commands/
│   ├── services/
│   └── providers/
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
└── LICENSE
```

> The actual structure depends on your implementation.

---

## 🔄 Typical User Flow

```text
                ┌─────────────────┐
                │     ProjectMan  │
                └────────┬────────┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
      Add Existing Project      Create Project
             │                       │
             └───────────┬───────────┘
                         ▼
                  Project List
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
           Open        Remove      Manage
```

---

## 💡 Use Cases

### 👨‍💻 Developers with many projects

Keep all your active projects accessible from one place, even when they are stored in different directories.

### 🏢 Work projects

Separate projects from different clients or teams while keeping quick access from VS Code.

### 🎓 University projects

Manage assignments, research projects, software projects, and personal experiments without repeatedly navigating through folders.

### 🧪 Testing and experiments

Create and keep temporary projects organized while experimenting with new technologies.

---

## ✅ Advantages

- Centralizes access to projects.
- Reduces repetitive folder navigation.
- Opens projects quickly.
- Supports projects stored in different locations.
- Allows adding existing projects.
- Allows creating new projects.
- Makes switching between projects easier.
- Keeps your development workflow inside Visual Studio Code.

---

## 📝 Tips

### Keep your projects organized

Use clear project names so they are easy to recognize in the ProjectMan interface.

### Avoid moving registered projects manually

If you move a project to another folder outside ProjectMan, its stored path may no longer be valid. Re-register the project or update its location according to the available functionality.

### Remove unused entries

Periodically clean old projects from your ProjectMan list to keep your workspace organized.

---

## 🐞 Troubleshooting

### The project does not open

Check that:

1. The project folder still exists.
2. The folder has not been moved or renamed.
3. The stored path is correct.
4. Visual Studio Code has permission to access the folder.

### A project disappeared from the list

Verify that the project entry has not been removed and that the extension data has not been reset.

### The extension does not appear

Try the following:

1. Reload Visual Studio Code.
2. Verify that ProjectMan is installed and enabled.
3. Check the Extension Host logs if the problem persists.

---

## 🔮 Future Improvements

Possible future improvements for ProjectMan include:

- Project search.
- Project categories or groups.
- Favorites.
- Recent projects.
- Project icons.
- Custom tags.
- Sorting and filtering.
- Project metadata.
- Workspace support.
- Import/export project lists.
- Cloud synchronization.
- Backup and restore.
- More project templates.
- Improved keyboard navigation.
- Custom commands and shortcuts.

---

## 🤝 Contributing

Contributions, ideas, and suggestions are welcome.

### Development

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/projectman.git
```

Open the project in Visual Studio Code:

```bash
cd projectman
code .
```

Install dependencies:

```bash
npm install
```

Run the extension in development mode using the VS Code extension development environment.

> Replace the repository URL and development commands according to your actual project configuration.

---

## 📣 Feedback and Suggestions

Have an idea to improve ProjectMan?

You can contribute by:

- Opening an issue.
- Reporting a bug.
- Suggesting a new feature.
- Sharing feedback.
- Contributing code.

Your feedback can help make ProjectMan better for the developer community.

---

## 📄 License

This project is distributed under the license included in the repository.

If the project uses the MIT License, add the following file:

```text
LICENSE
```

and include the appropriate MIT license text.

---

## 👨‍💻 Author

**ProjectMan**

A Visual Studio Code extension focused on making project management simpler, faster, and more organized.

---

## ⭐ Support the Project

If ProjectMan is useful to you, consider supporting the project by:

- ⭐ Rating the extension.
- ⭐ Leaving a review.
- 🐞 Reporting issues.
- 💡 Sharing ideas.
- 📢 Sharing ProjectMan with other developers.

Every interaction helps the project grow.

---

## 🚀 ProjectMan

> **Manage your projects. Open them faster. Keep everything organized — directly inside Visual Studio Code.**
