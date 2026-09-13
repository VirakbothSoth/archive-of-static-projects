document.addEventListener("DOMContentLoaded", () => {

    const cardViewEl = document.getElementById("cardView");
    const checklistListEl = document.getElementById("checklistList");
    const sortSelect = document.getElementById("sortSelect");
    const searchInput = document.getElementById("taskSearch");

    document.getElementById("todayDate").textContent = new Date().toLocaleDateString(undefined, {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    // --- Rendering ---

    function fmtDate(iso) {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }
    function fmtShortDate(iso) {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    function isOverdue(task) {
        return !task.IsCompleted && task.EndDate && new Date(task.EndDate) < new Date();
    }
    function accentColor(task) {
        if (task.IsCompleted) return "#198754";
        if (task.Priority === Priority.High) return "#dc3545";
        if (task.Priority === Priority.Medium) return "#ffc107";
        return "#adb5bd";
    }
    function badgeClass(task) {
        if (task.IsCompleted) return "bg-success-subtle text-success-emphasis";
        if (task.Priority === Priority.High) return "bg-danger-subtle text-danger-emphasis";
        if (task.Priority === Priority.Medium) return "bg-warning-subtle text-warning-emphasis";
        return "bg-secondary-subtle text-secondary-emphasis";
    }
    function badgeLabel(task) {
        return task.IsCompleted ? "Done" : PriorityNames[task.Priority];
    }

    function renderStats() {
        const topLevel = getTopLevelTasks();
        const total = topLevel.length;
        const highCount = topLevel.filter(t => t.Priority === Priority.High && !t.IsCompleted).length;
        const completedCount = topLevel.filter(t => t.IsCompleted).length;
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const dueSoon = topLevel.filter(t => !t.IsCompleted && t.EndDate && new Date(t.EndDate) <= weekFromNow).length;

        document.getElementById("statTotal").textContent = total;
        document.getElementById("statHigh").textContent = highCount;
        document.getElementById("statDueSoon").textContent = dueSoon;
        document.getElementById("statCompleted").textContent = completedCount;
    }

    function renderCard(task) {
        const subTasks = getSubTasks(task.Id);
        const doneSubs = subTasks.filter(s => s.IsCompleted).length;

        const el = document.createElement("div");
        el.className = "mb-3 rounded-3 overflow-hidden task-card";
        el.dataset.taskId = task.Id;
        el.dataset.priority = task.Priority;
        el.dataset.due = task.EndDate ? new Date(task.EndDate).getTime() : 9999999999999;
        el.dataset.title = task.Title.toLowerCase();
        el.dataset.hashtag = task.Hashtag || "";
        el.dataset.order = task.Id;

        el.innerHTML = `
            <div class="task-accent" style="background:${accentColor(task)}"></div>
            <div class="p-3 flex-grow-1">
                <div class="d-flex align-items-start gap-2">
                    <input type="checkbox" class="form-check-input mt-1 task-toggle" data-task-id="${task.Id}" ${task.IsCompleted ? "checked" : ""} style="cursor:pointer">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-start justify-content-between gap-2">
                            <a href="#" class="text-decoration-none flex-grow-1 task-details-link" data-task-id="${task.Id}">
                                <p class="mb-1 task-title ${task.IsCompleted ? "text-decoration-line-through text-muted" : ""}" style="font-size:15px;font-weight:500">${escapeHtml(task.Title)}</p>
                            </a>
                            <div class="d-flex align-items-center gap-2 flex-shrink-0" style="font-size:12px">
                                <a href="#" class="text-decoration-none text-muted task-edit-link" data-task-id="${task.Id}" style="color:#0d6efd" title="Edit task">Edit</a>
                                <a href="#" class="text-decoration-none text-danger task-delete-link" data-task-id="${task.Id}" title="Delete task">Delete</a>
                            </div>
                        </div>

                        ${task.Description ? `<p class="text-muted mb-2" style="font-size:13px">${escapeHtml(task.Description)}</p>` : ""}

                        <div class="d-flex flex-wrap gap-2 align-items-center">
                            <span class="badge rounded-pill task-badge ${badgeClass(task)}" style="font-size:11px">${badgeLabel(task)}</span>
                            ${task.Hashtag ? `<span style="font-size:12px;color:#0d6efd;font-family:monospace">${escapeHtml(task.Hashtag)}</span>` : ""}
                            ${task.EndDate ? `<span style="font-size:12px" class="${isOverdue(task) ? "text-danger fw-semibold" : "text-muted"}">${fmtDate(task.EndDate)}${isOverdue(task) ? " (overdue)" : ""}</span>` : ""}
                            ${task.Comment ? `<span class="text-muted" style="font-size:12px" title="${escapeHtml(task.Comment)}">💬 Note</span>` : ""}
                            ${task.AttachmentPath ? `<a href="${task.AttachmentPath}" target="_blank" class="text-decoration-none" style="font-size:12px" title="View Attachment">📎 Attachment</a>` : ""}
                        </div>

                        ${subTasks.length ? `
                        <div class="mt-3 pt-2" style="border-top:0.5px solid #dee2e6">
                            <div class="mb-1" style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6c757d">
                                Subtasks — ${doneSubs} / ${subTasks.length} done
                            </div>
                            ${subTasks.map(sub => `
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <span style="width:6px;height:6px;border-radius:50%;${sub.IsCompleted ? "background:#198754" : "border:1.5px solid #adb5bd"};display:inline-block;flex-shrink:0"></span>
                                    <span class="${sub.IsCompleted ? "text-muted text-decoration-line-through" : ""}" style="font-size:13px">${escapeHtml(sub.Title)}</span>
                                </div>
                            `).join("")}
                        </div>` : ""}
                    </div>
                </div>
            </div>
        `;
        return el;
    }

    function renderChecklistRow(task) {
        const el = document.createElement("div");
        el.className = "d-flex align-items-center gap-2 px-3 py-2 checklist-row task-card";
        el.dataset.taskId = task.Id;
        el.dataset.priority = task.Priority;
        el.dataset.due = task.EndDate ? new Date(task.EndDate).getTime() : 9999999999999;
        el.dataset.title = task.Title.toLowerCase();
        el.dataset.hashtag = task.Hashtag || "";
        el.dataset.completed = task.IsCompleted ? "1" : "0";
        el.dataset.order = task.Id;

        el.innerHTML = `
            <input type="checkbox" class="form-check-input task-toggle" data-task-id="${task.Id}" ${task.IsCompleted ? "checked" : ""} style="cursor:pointer">
            <a href="#" class="flex-grow-1 text-decoration-none task-title task-details-link ${task.IsCompleted ? "text-decoration-line-through text-muted" : ""}" data-task-id="${task.Id}" style="font-size:14px;color:inherit">
                ${escapeHtml(task.Title)}
            </a>
            ${task.AttachmentPath ? `<a href="${task.AttachmentPath}" target="_blank" class="text-decoration-none text-muted me-2" title="View Attachment">📎</a>` : ""}
            ${task.Hashtag ? `<span style="font-size:11px;color:#0d6efd;font-family:monospace">${escapeHtml(task.Hashtag)}</span>` : ""}
            ${task.EndDate ? `<span style="font-size:11px;min-width:80px;text-align:right" class="${isOverdue(task) ? "text-danger fw-semibold" : "text-muted"}">${fmtShortDate(task.EndDate)}</span>` : ""}
            <div class="d-flex align-items-center gap-2 flex-shrink-0 ms-2" style="font-size:12px">
                <a href="#" class="text-decoration-none text-muted task-edit-link" data-task-id="${task.Id}" style="color:#0d6efd" title="Edit task">Edit</a>
                <a href="#" class="text-decoration-none text-danger task-delete-link" data-task-id="${task.Id}" title="Delete task">Delete</a>
            </div>
        `;
        return el;
    }

    function escapeHtml(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    function renderAll() {
        renderStats();

        const topLevel = getTopLevelTasks();

        cardViewEl.innerHTML = "";
        checklistListEl.innerHTML = "";

        topLevel.forEach(task => {
            cardViewEl.appendChild(renderCard(task));
            checklistListEl.appendChild(renderChecklistRow(task));
        });

        applySort(sortSelect.value);
        applySearch();
        populateParentSelect();
        attachRowHandlers();
    }

    // --- Sort ---

    function getComparator(sortKey) {
        switch (sortKey) {
            case "priority_desc": return (a, b) => b.dataset.priority - a.dataset.priority;
            case "priority_asc": return (a, b) => a.dataset.priority - b.dataset.priority;
            case "due_asc": return (a, b) => a.dataset.due - b.dataset.due;
            case "due_desc":
                return (a, b) => {
                    const aHasDue = a.dataset.due !== "9999999999999";
                    const bHasDue = b.dataset.due !== "9999999999999";
                    if (!aHasDue && !bHasDue) return 0;
                    if (!aHasDue) return 1;
                    if (!bHasDue) return -1;
                    return b.dataset.due - a.dataset.due;
                };
            case "title_asc": return (a, b) => a.dataset.title.localeCompare(b.dataset.title);
            case "completed": return (a, b) => (a.dataset.completed || 0) - (b.dataset.completed || 0);
            default: return (a, b) => b.dataset.order - a.dataset.order;
        }
    }

    function applySort(sortKey) {
        const comparator = getComparator(sortKey);
        [cardViewEl, checklistListEl].forEach(container => {
            const cards = Array.from(container.querySelectorAll(".task-card"));
            cards.sort(comparator);
            cards.forEach(card => container.appendChild(card));
        });
    }

    sortSelect.addEventListener("change", e => applySort(e.target.value));

    // --- Search ---

    function applySearch() {
        const query = searchInput.value.trim().toLowerCase();
        [cardViewEl, checklistListEl].forEach(container => {
            container.querySelectorAll(".task-card").forEach(card => {
                const title = card.dataset.title;
                const hashtag = (card.dataset.hashtag || "").toLowerCase();
                const match = title.includes(query) || hashtag.includes(query);
                card.style.display = match ? "" : "none";
            });
        });
    }
    searchInput.addEventListener("input", applySearch);

    // --- View toggle ---

    const cardViewBtn = document.getElementById("cardViewBtn");
    const checklistViewBtn = document.getElementById("checklistViewBtn");
    const cardViewWrap = document.getElementById("cardView");
    const checklistViewWrap = document.getElementById("checklistView");

    function setView(mode) {
        if (mode === "checklist") {
            cardViewWrap.style.display = "none";
            checklistViewWrap.style.display = "block";
            cardViewBtn.classList.remove("active");
            checklistViewBtn.classList.add("active");
        } else {
            cardViewWrap.style.display = "block";
            checklistViewWrap.style.display = "none";
            checklistViewBtn.classList.remove("active");
            cardViewBtn.classList.add("active");
        }
    }
    cardViewBtn.addEventListener("click", () => setView("card"));
    checklistViewBtn.addEventListener("click", () => setView("checklist"));

    // --- Toggle complete / edit / delete (event delegation, re-attached after render) ---

    function attachRowHandlers() {
        document.querySelectorAll(".task-toggle").forEach(cb => {
            cb.onchange = e => {
                const id = Number(e.target.dataset.taskId);
                toggleComplete(id);
                renderAll();
            };
        });
        document.querySelectorAll(".task-edit-link").forEach(a => {
            a.onclick = e => {
                e.preventDefault();
                openEditModal(Number(a.dataset.taskId));
            };
        });
        document.querySelectorAll(".task-details-link").forEach(a => {
            a.onclick = e => {
                e.preventDefault();
                openEditModal(Number(a.dataset.taskId));
            };
        });
        document.querySelectorAll(".task-delete-link").forEach(a => {
            a.onclick = e => {
                e.preventDefault();
                const id = Number(a.dataset.taskId);
                if (confirm("Delete this task?")) {
                    TaskItems = TaskItems.filter(t => t.Id !== id && t.ParentTaskId !== id);
                    renderAll();
                }
            };
        });
    }

    // --- Add / Edit modal ---

    const taskModalEl = document.getElementById("taskModal");
    const taskModal = new bootstrap.Modal(taskModalEl);
    const taskModalTitle = document.getElementById("taskModalTitle");
    const saveTaskBtn = document.getElementById("saveTaskBtn");

    const fTaskId = document.getElementById("taskId");
    const fTitle = document.getElementById("fTitle");
    const fDescription = document.getElementById("fDescription");
    const fPriority = document.getElementById("fPriority");
    const fEndDate = document.getElementById("fEndDate");
    const fHashtag = document.getElementById("fHashtag");
    const fComment = document.getElementById("fComment");
    const fAttachment = document.getElementById("fAttachment");
    const fAttachmentCurrent = document.getElementById("fAttachmentCurrent");
    const fParentTaskId = document.getElementById("fParentTaskId");

    function populateParentSelect(excludeId) {
        const current = fParentTaskId.value;
        fParentTaskId.innerHTML = `<option value="">-- None (Top Level Task) --</option>`;
        getAllTasks()
            .filter(t => t.Id !== excludeId)
            .forEach(t => {
                const opt = document.createElement("option");
                opt.value = t.Id;
                opt.textContent = t.Title;
                fParentTaskId.appendChild(opt);
            });
        fParentTaskId.value = current;
    }

    function resetForm() {
        fTaskId.value = "";
        fTitle.value = "";
        fDescription.value = "";
        fPriority.value = "1";
        fEndDate.value = "";
        fHashtag.value = "";
        fComment.value = "";
        fAttachment.value = "";
        fAttachmentCurrent.textContent = "";
        fParentTaskId.value = "";
    }

    document.getElementById("addTaskBtn").addEventListener("click", () => {
        resetForm();
        populateParentSelect();
        taskModalTitle.textContent = "New Task";
        saveTaskBtn.textContent = "Create Task";
        taskModal.show();
    });

    function openEditModal(id) {
        const task = getTaskById(id);
        if (!task) return;
        resetForm();
        populateParentSelect(id);

        fTaskId.value = task.Id;
        fTitle.value = task.Title;
        fDescription.value = task.Description || "";
        fPriority.value = task.Priority;
        fEndDate.value = task.EndDate ? task.EndDate.slice(0, 10) : "";
        fHashtag.value = task.Hashtag || "";
        fComment.value = task.Comment || "";
        fParentTaskId.value = task.ParentTaskId ?? "";
        fAttachmentCurrent.textContent = task.AttachmentPath ? `Current file: ${task.AttachmentPath}` : "";

        taskModalTitle.textContent = "Edit Task";
        saveTaskBtn.textContent = "Save Changes";
        taskModal.show();
    }

    saveTaskBtn.addEventListener("click", () => {
        if (!fTitle.value.trim()) {
            fTitle.classList.add("is-invalid");
            return;
        }
        fTitle.classList.remove("is-invalid");

        const id = fTaskId.value ? Number(fTaskId.value) : null;

        // File attachments can't be written to disk from a static page;
        // we just remember the chosen file name for display, like a real upload would show.
        let attachmentPath = id ? (getTaskById(id).AttachmentPath || null) : null;
        if (fAttachment.files && fAttachment.files[0]) {
            attachmentPath = "/uploads/" + fAttachment.files[0].name;
        }

        const payload = {
            Title: fTitle.value.trim(),
            Description: fDescription.value.trim() || null,
            Priority: Number(fPriority.value),
            EndDate: fEndDate.value ? new Date(fEndDate.value).toISOString() : null,
            Hashtag: fHashtag.value.trim() || null,
            Comment: fComment.value.trim() || null,
            AttachmentPath: attachmentPath,
            ParentTaskId: fParentTaskId.value || null
        };

        if (id) {
            updateTask(id, payload);
        } else {
            payload.IsCompleted = false;
            createTask(payload);
        }

        taskModal.hide();
        renderAll();
    });

    // Privacy links: no server route in this static port, just no-op nicely
    document.getElementById("privacyLink").addEventListener("click", e => e.preventDefault());
    document.getElementById("privacyLink2").addEventListener("click", e => e.preventDefault());

    // Initial render
    renderAll();
});
