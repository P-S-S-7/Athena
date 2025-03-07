import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    ListOrdered, List, Link, Table, Code, RotateCcw
} from "lucide-react";
import "./RichTextEditor.css";

const RichTextEditor = ({ value, onChange, className, id }) => {
    const editorRef = useRef(null);
    const [currentColor, setCurrentColor] = useState("#000000");
    const [currentBgColor, setCurrentBgColor] = useState("#FFFFFF");
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        justifyLeft: false,
        justifyCenter: false,
        justifyRight: false,
        orderedList: false,
        unorderedList: false
    });

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = value || "";
        }

        document.execCommand("defaultParagraphSeparator", false, "p");
        document.execCommand('styleWithCSS', false, true);

        document.addEventListener('selectionchange', checkActiveFormats);

        return () => {
            document.removeEventListener('selectionchange', checkActiveFormats);
        };
    }, [value]);

    const checkActiveFormats = () => {
        if (!document.activeElement || document.activeElement !== editorRef.current) return;

        try {
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                justifyLeft: document.queryCommandState('justifyLeft'),
                justifyCenter: document.queryCommandState('justifyCenter'),
                justifyRight: document.queryCommandState('justifyRight'),
                orderedList: document.queryCommandState('insertOrderedList'),
                unorderedList: document.queryCommandState('insertUnorderedList')
            });
        } catch (e) {
            console.error("Error checking active formats:", e);
        }
    };

    const handleFormat = (command, value = null) => {
        editorRef.current.focus();

        try {
            document.execCommand(command, false, value);
            onChange(editorRef.current.innerHTML);
            checkActiveFormats();
        } catch (e) {
            console.error(`Error executing command ${command}:`, e);
        }
    };

    const handleTextColorClick = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = currentColor;

        input.addEventListener('change', (e) => {
            const newColor = e.target.value;
            setCurrentColor(newColor);
            handleFormat("foreColor", newColor);
        });

        input.click();
    };

    const handleBgColorClick = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = currentBgColor;

        input.addEventListener('change', (e) => {
            const newColor = e.target.value;
            setCurrentBgColor(newColor);
            handleFormat("hiliteColor", newColor);
        });

        input.click();
    };

    const handleInsertLink = () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();

        const linkText = prompt("Enter link text:", selectedText || "Link text");
        if (!linkText) return;

        const url = prompt("Enter the URL:", "https://");
        if (!url) return;

        editorRef.current.focus();

        if (selectedText) {
            document.execCommand('delete');
        }

        const linkHtml = `<a href="${url}" target="_blank">${linkText}</a>`;
        document.execCommand('insertHTML', false, linkHtml);
        onChange(editorRef.current.innerHTML);
    };

    const handleInsertTable = () => {
        const rows = prompt("Enter number of rows:", "3");
        const cols = prompt("Enter number of columns:", "3");

        if (!rows || !cols) return;

        editorRef.current.focus();

        let tableHtml = '<table border="1" style="width: 100%; border-collapse: collapse;">';
        for (let i = 0; i < parseInt(rows); i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < parseInt(cols); j++) {
                tableHtml += '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table><p><br></p>';

        document.execCommand('insertHTML', false, tableHtml);
        onChange(editorRef.current.innerHTML);
    };

    const handleInsertCode = () => {
        editorRef.current.focus();

        const codeHtml = '<pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; font-family: monospace;"><code>// Insert code here</code></pre><p><br></p>';
        document.execCommand('insertHTML', false, codeHtml);

        setTimeout(() => {
            const codeElement = editorRef.current.querySelector('code');
            if (codeElement) {
                const range = document.createRange();
                const selection = window.getSelection();
                range.setStart(codeElement, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }, 0);

        onChange(editorRef.current.innerHTML);
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to clear all content?")) {
            editorRef.current.innerHTML = "";
            onChange("");
            checkActiveFormats();
        }
    };

    const handleEditorInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            checkActiveFormats();
        }
    };

    const handleEditorFocus = () => {
        try {
            document.execCommand('defaultParagraphSeparator', false, 'p');
            document.execCommand('styleWithCSS', false, true);
        } catch (e) {
            console.error('Failed to set editor defaults:', e);
        }
        checkActiveFormats();
    };

    return (
        <div className={`rich-text-editor ${className || ''}`} dir="ltr">
            <div className="toolbar">
                <div className="toolbar-group">
                    <Button
                        type="button"
                        onClick={() => handleFormat("bold")}
                        title="Bold (Ctrl+B)"
                        variant={activeFormats.bold ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <Bold size={16} />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleFormat("italic")}
                        title="Italic (Ctrl+I)"
                        variant={activeFormats.italic ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <Italic size={16} />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleFormat("underline")}
                        title="Underline (Ctrl+U)"
                        variant={activeFormats.underline ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <Underline size={16} />
                    </Button>
                </div>

                <div className="toolbar-group">
                    <div className="color-control">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="color-btn"
                            style={{ backgroundColor: currentColor }}
                            title="Text Color"
                            onClick={handleTextColorClick}
                        >
                            <span className="color-preview"></span>
                        </Button>
                        <span className="color-label">Text</span>
                    </div>
                    <div className="color-control">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="color-btn"
                            style={{ backgroundColor: currentBgColor }}
                            title="Background Color"
                            onClick={handleBgColorClick}
                        >
                            <span className="color-preview"></span>
                        </Button>
                        <span className="color-label">Highlight</span>
                    </div>
                </div>

                <div className="toolbar-group">
                    <Button
                        type="button"
                        onClick={() => handleFormat("justifyLeft")}
                        title="Align Left"
                        variant={activeFormats.justifyLeft ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <AlignLeft size={16} />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleFormat("justifyCenter")}
                        title="Align Center"
                        variant={activeFormats.justifyCenter ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <AlignCenter size={16} />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleFormat("justifyRight")}
                        title="Align Right"
                        variant={activeFormats.justifyRight ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <AlignRight size={16} />
                    </Button>
                </div>

                <div className="toolbar-group">
                    <Button
                        type="button"
                        onClick={() => handleFormat("insertOrderedList")}
                        title="Ordered List"
                        variant={activeFormats.orderedList ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <ListOrdered size={16} />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleFormat("insertUnorderedList")}
                        title="Unordered List"
                        variant={activeFormats.unorderedList ? "default" : "outline"}
                        size="icon"
                        className="editor-btn"
                    >
                        <List size={16} />
                    </Button>
                </div>

                <div className="toolbar-group">
                    <Button
                        type="button"
                        onClick={handleInsertLink}
                        title="Insert Link"
                        variant="outline"
                        size="icon"
                        className="editor-btn"
                    >
                        <Link size={16} />
                    </Button>
                    <Button
                        type="button"
                        onClick={handleInsertTable}
                        title="Insert Table"
                        variant="outline"
                        size="icon"
                        className="editor-btn"
                    >
                        <Table size={16} />
                    </Button>
                    <Button
                        type="button"
                        onClick={handleInsertCode}
                        title="Insert Code Block"
                        variant="outline"
                        size="icon"
                        className="editor-btn"
                    >
                        <Code size={16} />
                    </Button>
                </div>

                <div className="toolbar-group">
                    <Button
                        type="button"
                        onClick={handleReset}
                        title="Reset"
                        variant="outline"
                        size="icon"
                        className="editor-btn danger-btn"
                    >
                        <RotateCcw size={16} />
                    </Button>
                </div>
            </div>
            <iframe
                id={id}
                ref={editorRef}
                className="editor-iframe"
                style={{
                    width: '100%',
                    minHeight: '250px',
                    border: 'none',
                    display: 'block',
                }}
                onLoad={() => {
                    const doc = editorRef.current.contentDocument;
                    const body = doc.body;

                    body.innerHTML = value || '';

                    const style = doc.createElement('style');
                    style.textContent = `
                        body {
                            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                            padding: 16px;
                            margin: 0;
                            direction: ltr;
                            overflow-y: auto;
                        }
                        pre {
                            background: #f4f4f4;
                            padding: 10px;
                            border-radius: 5px;
                            overflow-x: auto;
                        }
                        pre code {
                            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin: 16px 0;
                        }
                        td, th {
                            border: 1px solid #ddd;
                            padding: 8px;
                        }
                        a {
                            color: #3b82f6;
                            text-decoration: underline;
                        }
                    `;
                    doc.head.appendChild(style);

                    body.contentEditable = 'true';
                    body.dir = 'ltr';

                    body.addEventListener('input', () => {
                        onChange(body.innerHTML);
                        checkActiveFormats();
                    });

                    body.addEventListener('focus', () => {
                        try {
                            doc.execCommand('defaultParagraphSeparator', false, 'p');
                            doc.execCommand('styleWithCSS', false, true);
                        } catch (e) {}
                        checkActiveFormats();
                    });

                    body.addEventListener('click', checkActiveFormats);
                    body.addEventListener('keyup', checkActiveFormats);

                    const originalExecCommand = document.execCommand;
                    document.execCommand = function(command, showUI, value) {
                        try {
                            return doc.execCommand(command, showUI, value);
                        } catch (e) {
                            console.error(`Error executing command ${command}:`, e);
                            return false;
                        }
                    };

                    editorRef.current._originalExecCommand = originalExecCommand;
                }}
            />
        </div>
    );
};

export default RichTextEditor;
