import { useState, useEffect, useCallback, useRef } from "react";

function MainComponent() {
  const [entries, setEntries] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPromptSheet, setShowPromptSheet] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingEntries, setPendingEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const editableEntryRefs = useRef({});

  const formatDateISO = (date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    if (typeof timeStr === "string") {
      return timeStr.substring(0, 5);
    }
    return new Date(timeStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/getEntries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formatDateISO(currentDate) }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching entries: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setEntries(data.entries || []);
    } catch (err) {
      console.error("Failed to load entries:", err);
      setError("Failed to load entries. Please try again.");
      const savedEntries = localStorage.getItem(
        `switchlog-${formatDateISO(currentDate)}`
      );
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      }
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  const loadSystemPrompt = useCallback(async () => {
    try {
      const response = await fetch("/api/getSystemPrompt", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Error fetching system prompt: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.warn(data.error);
        setSystemPrompt(
          "Categorize my tasks and summarize how I spent my time today."
        );
        return;
      }

      setSystemPrompt(data.prompt || "");
    } catch (err) {
      console.error("Failed to load system prompt:", err);
      setSystemPrompt(
        "Categorize my tasks and summarize how I spent my time today."
      );
    }
  }, []);

  useEffect(() => {
    loadEntries();
    loadSystemPrompt();
  }, [loadEntries, loadSystemPrompt]);

  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem(
        `switchlog-${formatDateISO(currentDate)}`,
        JSON.stringify(entries)
      );
    }
  }, [entries, currentDate]);

  const handleEditorClick = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const text = e.target.innerText.trim();

      if (text) {
        const now = new Date();
        const timeStr = now.toTimeString().substring(0, 8);

        const newEntry = {
          id: `pending-${Date.now()}`,
          date: formatDateISO(currentDate),
          time: timeStr,
          text: text,
          created_at: now.toISOString(),
          isPending: true,
        };

        setPendingEntries((prev) => [...prev, newEntry]);
        e.target.innerText = "";

        saveEntry(text, newEntry.id);
      }
    } else if (e.key === "Backspace" && e.target.innerText.trim() === "") {
      e.preventDefault();

      // Get all entries sorted by time
      const sortedEntries = [...entries, ...pendingEntries].sort((a, b) => {
        return a.time.localeCompare(b.time);
      });

      if (sortedEntries.length > 0) {
        // Find the last entry to focus on when backspace is pressed in empty input
        const lastEntry = sortedEntries[sortedEntries.length - 1];

        if (!lastEntry.id.toString().startsWith("pending-")) {
          addDebugLog("Backspace pressed on empty main input", {
            focusingEntryId: lastEntry.id,
          });

          // Set this entry as the one being edited
          setEditingEntryId(lastEntry.id);

          // Focus the entry after a short delay to ensure the DOM is updated
          setTimeout(() => {
            const entryElement = editableEntryRefs.current[lastEntry.id];
            addDebugLog("Focusing last entry element", {
              exists: !!entryElement,
              id: lastEntry.id,
            });

            if (entryElement) {
              entryElement.focus();

              // Position cursor at the end of the text
              const range = document.createRange();
              const sel = window.getSelection();

              if (entryElement.childNodes.length > 0) {
                const textNode = entryElement.childNodes[0];
                range.setStart(textNode, textNode.length);
                range.setEnd(textNode, textNode.length);
                sel.removeAllRanges();
                sel.addRange(range);
                addDebugLog("Cursor positioned at end of text");
              }
            }
          }, 50);
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const text = e.clipboardData.getData("text/plain");

    if (!text) return;

    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length === 0) return;

    if (lines.length === 1) {
      document.execCommand("insertText", false, lines[0]);
      return;
    }

    const newPendingEntries = [];

    lines.forEach((line) => {
      if (line.trim()) {
        const now = new Date();
        const timeStr = now.toTimeString().substring(0, 8);

        const newEntry = {
          id: `pending-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
          date: formatDateISO(currentDate),
          time: timeStr,
          text: line.trim(),
          created_at: now.toISOString(),
          isPending: true,
        };

        newPendingEntries.push(newEntry);
      }
    });

    if (newPendingEntries.length > 0) {
      setPendingEntries((prev) => [...prev, ...newPendingEntries]);

      newPendingEntries.forEach((entry) => {
        saveEntry(entry.text, entry.id);
      });
    }
  };

  const saveEntry = async (text, pendingId) => {
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 8);

    try {
      const response = await fetch("/api/saveEntry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formatDateISO(currentDate),
          time: timeStr,
          text: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error saving entry: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.entry) {
        setEntries((prev) => [...prev, data.entry]);
        setPendingEntries((prev) =>
          prev.filter((entry) => entry.id !== pendingId)
        );
      }
    } catch (err) {
      console.error("Failed to save entry:", err);
      setError("Failed to save entry. Please try again.");

      setPendingEntries((prev) =>
        prev.map((entry) =>
          entry.id === pendingId ? { ...entry, saveError: true } : entry
        )
      );
    }
  };

  const addNewEntry = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const updateEntryTime = async (id, newTime) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    try {
      const response = await fetch("/api/saveEntry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          date: entry.date,
          time: newTime,
          text: entry.text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error updating entry: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.entry) {
        setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
      }
    } catch (err) {
      console.error("Failed to update entry time:", err);
      setError("Failed to update entry time. Please try again.");
    }
  };

  const deleteEntry = async (id) => {
    if (id.toString().startsWith("pending-")) {
      setPendingEntries((prev) => prev.filter((entry) => entry.id !== id));
      return;
    }

    try {
      const response = await fetch("/api/deleteEntry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Error deleting entry: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error("Failed to delete entry:", err);
      setError("Failed to delete entry. Please try again.");
    }
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
    setPendingEntries([]);
  };

  const saveSystemPrompt = async () => {
    try {
      const response = await fetch("/api/saveSystemPrompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: systemPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Error saving system prompt: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setShowPromptSheet(false);
    } catch (err) {
      console.error("Failed to save system prompt:", err);
      setError("Failed to save system prompt. Please try again.");
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generateInsights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formatDateISO(currentDate),
          prompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error generating insights: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setInsights(data.insight.formatted_result);
      setShowInsights(true);
    } catch (err) {
      console.error("Failed to generate insights:", err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/getInsights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: formatDateISO(currentDate) }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching insights: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.insight) {
        setInsights(data.insight.formatted_result);
        setShowInsights(true);
      } else {
        generateInsights();
      }
    } catch (err) {
      console.error("Failed to load insights:", err);
      setError("Failed to load insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const allEntries = [...entries, ...pendingEntries].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const updateEntryText = async (id, newText) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    try {
      const response = await fetch("/api/saveEntry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          date: entry.date,
          time: entry.time,
          text: newText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error updating entry: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.entry) {
        setEntries((prev) => prev.map((e) => (e.id === id ? data.entry : e)));
      }
    } catch (err) {
      console.error("Failed to update entry text:", err);
      setError("Failed to update entry text. Please try again.");
    }
  };

  const handleEntryEdit = (id, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newText = e.target.innerText.trim();

      if (newText) {
        updateEntryText(id, newText);
        setEditingEntryId(null);

        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingEntryId(null);

      const entry = entries.find((e) => e.id === id);
      if (entry && e.target) {
        e.target.innerText = entry.text;
      }

      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } else if (e.key === "Backspace" && e.target.innerText === "") {
      e.preventDefault();
      addDebugLog("Backspace pressed on empty entry", { id });

      const sortedEntries = [...entries, ...pendingEntries].sort((a, b) => {
        return a.time.localeCompare(b.time);
      });

      addDebugLog("Sorted entries", {
        count: sortedEntries.length,
        first: sortedEntries[0]?.id,
        last: sortedEntries[sortedEntries.length - 1]?.id,
      });

      const currentIndex = sortedEntries.findIndex((entry) => entry.id === id);
      addDebugLog("Current entry index", { currentIndex, id });

      deleteEntry(id);
      addDebugLog("Entry deleted", { id });

      setEditingEntryId(null);
      addDebugLog("Editing ID cleared");

      if (currentIndex > 0) {
        const previousEntry = sortedEntries[currentIndex - 1];
        addDebugLog("Previous entry found", {
          id: previousEntry.id,
          isPending: previousEntry.id.toString().startsWith("pending-"),
          text: previousEntry.text.substring(0, 20) + "...",
        });

        if (!previousEntry.id.toString().startsWith("pending-")) {
          addDebugLog("Setting timeout to focus previous entry");
          setTimeout(() => {
            addDebugLog("Timeout fired - setting editing ID", {
              newEditingId: previousEntry.id,
            });
            setEditingEntryId(previousEntry.id);

            setTimeout(() => {
              addDebugLog("Inner timeout fired - focusing element");
              const entryElement = editableEntryRefs.current[previousEntry.id];
              addDebugLog("Entry element reference", {
                exists: !!entryElement,
                childNodes: entryElement?.childNodes?.length,
              });

              if (entryElement) {
                entryElement.focus();
                addDebugLog("Focus called on element");

                const range = document.createRange();
                const sel = window.getSelection();

                if (entryElement.childNodes.length > 0) {
                  const textNode = entryElement.childNodes[0];
                  addDebugLog("Text node found", {
                    textLength: textNode.length,
                  });
                  range.setStart(textNode, textNode.length);
                  range.setEnd(textNode, textNode.length);
                  sel.removeAllRanges();
                  sel.addRange(range);
                  addDebugLog("Selection range set");
                } else {
                  addDebugLog("No text nodes found in element");
                }
              } else {
                addDebugLog("Entry element not found in refs", {
                  availableRefs: Object.keys(editableEntryRefs.current),
                });
              }
            }, 100);
          }, 200);
        } else {
          addDebugLog("Previous entry is pending, focusing main input");
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              addDebugLog("Main input focused");
            } else {
              addDebugLog("Main input ref not available");
            }
          }, 100);
        }
      } else {
        addDebugLog("No previous entry, focusing main input");
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            addDebugLog("Main input focused");
          } else {
            addDebugLog("Main input ref not available");
          }
        }, 100);
      }
    }
  };

  const handleEntryClick = (id) => {
    if (id.toString().startsWith("pending-")) return;

    setEditingEntryId(id);

    setTimeout(() => {
      const entryElement = editableEntryRefs.current[id];
      if (entryElement) {
        entryElement.focus();

        const range = document.createRange();
        const sel = window.getSelection();

        if (entryElement.childNodes.length > 0) {
          const textNode = entryElement.childNodes[0];
          range.setStart(textNode, textNode.length);
          range.setEnd(textNode, textNode.length);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }, 0);
  };

  const addDebugLog = (message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: JSON.stringify(data),
    };
    console.log(`DEBUG [${timestamp}]: ${message}`, data);
    setDebugLogs((prev) => [logEntry, ...prev].slice(0, 50));
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      <header className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDay(-1)}
            className="text-gray-500 hover:text-gray-700 px-2"
            aria-label="Previous day"
          >
            ‹
          </button>

          <h1 className="text-xl font-light">
            {formatDisplayDate(currentDate)}
          </h1>

          <button
            onClick={() => navigateDay(1)}
            className="text-gray-500 hover:text-gray-700 px-2"
            aria-label="Next day"
          >
            ›
          </button>
        </div>
      </header>

      <main
        className="flex-1 overflow-y-auto p-4"
        ref={editorRef}
        onClick={handleEditorClick}
      >
        {error && (
          <div className="bg-red-50 text-red-700 p-2 mb-4 rounded">{error}</div>
        )}

        <div
          className="mb-4 p-2 bg-gray-100 rounded max-h-40 overflow-y-auto"
          style={{ display: debugLogs.length > 0 ? "block" : "none" }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold">Debug Logs</h3>
            <button
              onClick={() => setDebugLogs([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          {debugLogs.map((log, i) => (
            <div key={i} className="text-xs mb-1 font-mono">
              <span className="text-gray-500">
                {log.timestamp.substring(11, 19)}
              </span>
              :<span className="text-gray-800 ml-1">{log.message}</span>
              {log.data !== "{}" && (
                <span className="text-gray-600 ml-1 text-xs">{log.data}</span>
              )}
            </div>
          ))}
        </div>

        {loading && !allEntries.length && (
          <div className="text-center text-gray-400 my-4">Loading...</div>
        )}

        {allEntries.map((entry) => (
          <div key={entry.id} className="flex mb-3 group">
            <div className="w-20 text-right pr-3 text-gray-400 flex items-start">
              <TimeEditor
                time={entry.time}
                entryId={entry.id}
                updateTime={updateEntryTime}
                isPending={entry.isPending}
              />
            </div>
            <div className="flex-1 flex items-start">
              <div
                ref={(el) => (editableEntryRefs.current[entry.id] = el)}
                className={`flex-1 font-mono ${
                  entry.isPending ? "text-gray-400" : ""
                } 
                  ${entry.saveError ? "text-red-500" : ""} 
                  ${
                    editingEntryId === entry.id
                      ? "outline-none border-b border-gray-300"
                      : ""
                  }
                  ${!entry.isPending ? "cursor-text" : ""}`}
                contentEditable={editingEntryId === entry.id}
                suppressContentEditableWarning={true}
                onClick={() => !entry.isPending && handleEntryClick(entry.id)}
                onKeyDown={(e) =>
                  editingEntryId === entry.id && handleEntryEdit(entry.id, e)
                }
                onBlur={() => {
                  if (editingEntryId === entry.id) {
                    const newText =
                      editableEntryRefs.current[entry.id]?.innerText.trim();
                    if (newText && newText !== entry.text) {
                      updateEntryText(entry.id, newText);
                    }
                    setEditingEntryId(null);
                  }
                }}
              >
                {entry.text}
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 ml-2"
                aria-label="Delete entry"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        <div className="flex mt-4">
          <div className="w-20 text-right pr-3 text-gray-400">
            {formatTime(new Date())}
          </div>
          <div className="flex-1">
            <div
              ref={textareaRef}
              className="outline-none w-full font-mono min-h-[24px] border-b border-transparent focus:border-gray-200 empty:before:content-[attr(placeholder)] empty:before:text-gray-400"
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="What are you working on? (Press Enter to save)"
              data-placeholder="What are you working on? (Press Enter to save)"
            ></div>
          </div>
        </div>

        {allEntries.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400">
              Start typing to log your first task switch
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200">
        <div className="p-3 flex justify-between items-center">
          <div className="text-gray-400 text-sm">Press Enter to save</div>

          <div className="flex">
            <button
              onClick={() => setShowPromptSheet(true)}
              className="text-gray-500 hover:text-gray-700 mr-4"
              aria-label="System prompt settings"
            >
              ⚙︎ Prompt
            </button>

            <button
              onClick={loadInsights}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Generate insights"
            >
              Insights
            </button>
          </div>
        </div>
      </footer>

      {showPromptSheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">System Prompt</h2>
              <button
                onClick={() => setShowPromptSheet(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              This prompt will be used to generate insights from your daily
              logs.
            </p>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-32 p-2 border border-gray-300 rounded mb-4 font-mono"
              placeholder="Enter your system prompt here..."
            ></textarea>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPromptSheet(false)}
                className="text-gray-500 hover:text-gray-700 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={saveSystemPrompt}
                className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showInsights && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">Insights</h2>
              <button
                onClick={() => setShowInsights(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="font-mono whitespace-pre-line">{insights}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeEditor({ time, entryId, updateTime, isPending }) {
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState(parseInt(time?.split(":")[0]) || 0);
  const [minutes, setMinutes] = useState(parseInt(time?.split(":")[1]) || 0);

  const handleSave = () => {
    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    updateTime(entryId, `${formattedHours}:${formattedMinutes}:00`);
    setEditing(false);
  };

  if (editing && !isPending) {
    return (
      <div className="flex items-center space-x-1">
        <select
          value={hours}
          onChange={(e) => setHours(parseInt(e.target.value))}
          className="w-12 bg-gray-100 rounded text-sm"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value))}
          className="w-12 bg-gray-100 rounded text-sm"
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {i.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <button onClick={handleSave} className="text-blue-500 text-sm">
          ✓
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={() => !isPending && setEditing(true)}
      className={`cursor-pointer hover:text-gray-600 ${
        isPending ? "text-gray-300" : ""
      }`}
    >
      {time ? time.substring(0, 5) : "00:00"}
    </span>
  );
}

export default MainComponent;
