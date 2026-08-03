import * as React from "react";
import { createRoot } from "react-dom/client";
import { DropdownMenu } from "@popright/react";
import "popright/styles.css";
import "popright/dropdown.css";
import logoUrl from "../../assets/popright-logo.png";
import "./demo.css";

interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ label, ...props }, ref) => (
    <button {...props} ref={ref} className="toolbar-button" type="button">
      {label}
      <span className="chevron" aria-hidden="true" />
    </button>
  )
);

function Demo() {
  const [status, setStatus] = React.useState("Ready");
  const [openCount, setOpenCount] = React.useState(0);
  const forwardedRef = React.useRef<HTMLButtonElement>(null);
  const [forwardedAttached, setForwardedAttached] = React.useState(false);
  const setForwardedRef = React.useCallback((node: HTMLButtonElement | null) => {
    forwardedRef.current = node;
    setForwardedAttached(node !== null);
  }, []);

  const fileItems = React.useMemo(
    () => [
      { id: "new", label: "New document", shortcut: "Ctrl+N", onSelect: () => setStatus("New document created") },
      { id: "open", label: "Open...", shortcut: "Ctrl+O", onSelect: () => setStatus("Open selected") },
      { type: "separator" as const },
      { id: "save", label: "Save", shortcut: "Ctrl+S", onSelect: () => setStatus("Document saved") }
    ],
    []
  );
  const viewItems = React.useMemo(
    () => [
      { id: "compact", label: "Compact density", onSelect: () => setStatus("Compact density selected") },
      { id: "comfortable", label: "Comfortable density", onSelect: () => setStatus("Comfortable density selected") }
    ],
    []
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="../" aria-label="Popright home">
          <span className="brand-crop"><img src={logoUrl} alt="Popright" /></span>
        </a>
        <span className="runtime-badge">React {React.version}</span>
      </header>

      <section className="workspace" aria-label="React dropdown demo">
        <div className="menu-bar">
          <DropdownMenu
            items={fileItems}
            onOpen={() => {
              setOpenCount((count) => count + 1);
              setStatus("File menu opened");
            }}
          >
            <button className="toolbar-button" type="button">
              File
              <span className="chevron" aria-hidden="true" />
            </button>
          </DropdownMenu>

          <DropdownMenu items={viewItems} onOpen={() => setStatus("View menu opened")}>
            <ToolbarButton ref={setForwardedRef} label="View" />
          </DropdownMenu>

          <span className="menu-spacer" />
          <a href="https://github.com/vincentlaucsb/popright" className="source-link">Source</a>
        </div>

        <div className="document">
          <div className="document-heading">
            <p className="kicker">REACT ADAPTER</p>
            <h1>Dropdown menus that stay attached</h1>
          </div>
          <div className="document-grid">
            <article>
              <h2>Simple mode</h2>
              <code>{"<DropdownMenu items={items}><button>File</button></DropdownMenu>"}</code>
            </article>
            <article>
              <h2>Runtime</h2>
              <dl>
                <div><dt>StrictMode</dt><dd>Enabled</dd></div>
                <div><dt>File opens</dt><dd data-testid="open-count">{openCount}</dd></div>
                <div><dt>Forwarded ref</dt><dd>{forwardedAttached ? "Attached" : "Pending"}</dd></div>
              </dl>
            </article>
          </div>
        </div>

        <footer className="status-bar" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          <span>{status}</span>
        </footer>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>
);
