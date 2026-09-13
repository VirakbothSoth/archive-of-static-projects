// Ported from the ASP.NET TaskPlanner's TaskItem model (Models/TaskItem.cs) and
// AppDbContext (Models/AppDbContext.cs). The original DB had no seeded rows, so this
// starting data is sample data shaped exactly like the C# model, kept only in memory
// for the current browser session (no cookies / localStorage).

const Priority = { Low: 0, Medium: 1, High: 2 };
const PriorityNames = ["Low", "Medium", "High"];

// Simple in-memory "table" of tasks, mirroring the TaskItem C# class:
// Id, Title, Description, Priority, EndDate, Hashtag, Comment,
// AttachmentPath, IsCompleted, ParentTaskId
let TaskItems = [
  {
    Id: 1,
    Title: "Plan project kickoff",
    Description: "Draft agenda and invite the team",
    Priority: Priority.High,
    EndDate: addDays(2),
    Hashtag: "#work",
    Comment: "Book the conference room",
    AttachmentPath: null,
    IsCompleted: false,
    ParentTaskId: null
  },
  {
    Id: 2,
    Title: "Grocery shopping",
    Description: "Milk, eggs, bread, coffee",
    Priority: Priority.Low,
    EndDate: addDays(1),
    Hashtag: "#home",
    Comment: null,
    AttachmentPath: null,
    IsCompleted: false,
    ParentTaskId: null
  },
  {
    Id: 3,
    Title: "Finish quarterly report",
    Description: "Include Q3 revenue breakdown",
    Priority: Priority.High,
    EndDate: addDays(-1),
    Hashtag: "#work",
    Comment: "Waiting on numbers from finance",
    AttachmentPath: null,
    IsCompleted: false,
    ParentTaskId: null
  },
  {
    Id: 4,
    Title: "Gather revenue numbers",
    Description: "Ask finance for Q3 totals",
    Priority: Priority.Medium,
    EndDate: addDays(-2),
    Hashtag: null,
    Comment: null,
    AttachmentPath: null,
    IsCompleted: true,
    ParentTaskId: 3
  },
  {
    Id: 5,
    Title: "Write executive summary",
    Description: null,
    Priority: Priority.Medium,
    EndDate: addDays(0),
    Hashtag: null,
    Comment: null,
    AttachmentPath: null,
    IsCompleted: false,
    ParentTaskId: 3
  },
  {
    Id: 6,
    Title: "Read a book",
    Description: "Something fiction, for fun",
    Priority: Priority.Low,
    EndDate: null,
    Hashtag: "#leisure",
    Comment: null,
    AttachmentPath: null,
    IsCompleted: true,
    ParentTaskId: null
  },
  {
    Id: 7,
    Title: "Renew car insurance",
    Description: "Policy expires end of month",
    Priority: Priority.Medium,
    EndDate: addDays(6),
    Hashtag: "#home",
    Comment: null,
    AttachmentPath: null,
    IsCompleted: false,
    ParentTaskId: null
  }
];

let nextId = TaskItems.reduce((max, t) => Math.max(max, t.Id), 0) + 1;

function addDays(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// --- Simple "repository" helpers, standing in for the EF Core DbContext ---

function getAllTasks() {
  return TaskItems;
}

function getTopLevelTasks() {
  return TaskItems.filter(t => t.ParentTaskId == null);
}

function getSubTasks(parentId) {
  return TaskItems.filter(t => t.ParentTaskId === parentId);
}

function getTaskById(id) {
  return TaskItems.find(t => t.Id === id) || null;
}

function createTask(task) {
  task.Id = nextId++;
  if (task.ParentTaskId === "" || task.ParentTaskId === undefined) task.ParentTaskId = null;
  else task.ParentTaskId = Number(task.ParentTaskId);
  TaskItems.push(task);
  return task;
}

function updateTask(id, updates) {
  const task = getTaskById(id);
  if (!task) return null;
  Object.assign(task, updates);
  if (task.ParentTaskId === "" || task.ParentTaskId === undefined) task.ParentTaskId = null;
  else task.ParentTaskId = Number(task.ParentTaskId);
  return task;
}

function toggleComplete(id) {
  const task = getTaskById(id);
  if (!task) return null;
  task.IsCompleted = !task.IsCompleted;
  return task;
}
