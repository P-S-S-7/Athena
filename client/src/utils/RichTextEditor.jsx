import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
    ListOrdered, List, Link, Table, Code, RotateCcw, MessageSquare, Image,
    Trash2, Plus, Minus, X
} from "lucide-react";
import CannedResponseSelector from '@/components/shared/CannedResponseSelector';
import "./RichTextEditor.css";

const RichTextEditor = ({ value, onChange, className, id, onCannedResponseAttachmentsChange, onCannedResponseInserted }) => {
    const editorRef = useRef(null);
    const cannedResponseBtnRef = useRef(null);
    const [currentColor, setCurrentColor] = useState("#000000");
    const [currentBgColor, setCurrentBgColor] = useState("#FFFFFF");
    const [showTableMenu, setShowTableMenu] = useState(false);
    const [tableMenuPosition, setTableMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedTable, setSelectedTable] = useState(null);
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
        document.addEventListener('click', handleOutsideClick);

        return () => {
            document.removeEventListener('selectionchange', checkActiveFormats);
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [value]);

    const handleOutsideClick = (e) => {
        if (showTableMenu && !e.target.closest('.table-menu')) {
            setShowTableMenu(false);
        }
    };

    const checkActiveFormats = () => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        try {
            const doc = editorRef.current.contentDocument;
            setActiveFormats({
                bold: doc.queryCommandState('bold'),
                italic: doc.queryCommandState('italic'),
                underline: doc.queryCommandState('underline'),
                justifyLeft: doc.queryCommandState('justifyLeft'),
                justifyCenter: doc.queryCommandState('justifyCenter'),
                justifyRight: doc.queryCommandState('justifyRight'),
                orderedList: doc.queryCommandState('insertOrderedList'),
                unorderedList: doc.queryCommandState('insertUnorderedList')
            });
        } catch (e) {
            console.error("Error checking active formats:", e);
        }
    };

    const handleFormat = (command, value = null) => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        editorRef.current.contentDocument.body.focus();

        try {
            editorRef.current.contentDocument.execCommand(command, false, value);
            onChange(editorRef.current.contentDocument.body.innerHTML);
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
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        const doc = editorRef.current.contentDocument;
        const selection = doc.getSelection();
        const selectedText = selection.toString();

        const linkText = prompt("Enter link text:", selectedText || "Link text");
        if (!linkText) return;

        const url = prompt("Enter the URL:", "https://");
        if (!url) return;

        doc.body.focus();

        if (selectedText) {
            doc.execCommand('delete');
        }

        const linkHtml = `<a href="${url}" target="_blank">${linkText}</a>`;
        doc.execCommand('insertHTML', false, linkHtml);
        onChange(doc.body.innerHTML);
    };

    const handleInsertImage = () => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        const url = prompt("Enter image URL:", "https://");
        if (!url) return;

        editorRef.current.contentDocument.body.focus();

        const imgHtml = `<div class="image-container" contenteditable="false">
                            <img src="${url}" style="max-width: 100%; height: auto;" alt="Inserted image" />
                            <button class="image-delete-btn" title="Delete image">×</button>
                         </div><p><br></p>`;
        editorRef.current.contentDocument.execCommand('insertHTML', false, imgHtml);

        setTimeout(() => {
            setupImageEvents();
        }, 0);

        onChange(editorRef.current.contentDocument.body.innerHTML);
    };

    const setupImageEvents = () => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        const deleteButtons = editorRef.current.contentDocument.querySelectorAll('.image-delete-btn');
        deleteButtons.forEach(btn => {
            if (!btn.hasEventListener) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const container = this.parentNode;
                    container.parentNode.removeChild(container);
                    onChange(editorRef.current.contentDocument.body.innerHTML);
                });
                btn.hasEventListener = true;
            }
        });
    };

    const handleInsertTable = () => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        const rows = prompt("Enter number of rows:", "3");
        const cols = prompt("Enter number of columns:", "3");

        if (!rows || !cols) return;

        editorRef.current.contentDocument.body.focus();

        let tableHtml = '<table class="editor-table" border="1" style="width: 100%; border-collapse: collapse;">';
        for (let i = 0; i < parseInt(rows); i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < parseInt(cols); j++) {
                tableHtml += '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table><p><br></p>';

        editorRef.current.contentDocument.execCommand('insertHTML', false, tableHtml);

        setTimeout(() => {
            setupTableEvents();
        }, 0);

        onChange(editorRef.current.contentDocument.body.innerHTML);
    };

    const setupTableEvents = () => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        const tables = editorRef.current.contentDocument.querySelectorAll('table.editor-table');
        tables.forEach(table => {
            if (!table.hasTableEventListener) {
                table.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const iframeRect = editorRef.current.getBoundingClientRect();
                    const rect = e.target.closest('table').getBoundingClientRect();

                    setSelectedTable(table);
                    setTableMenuPosition({
                        x: rect.right + iframeRect.left - 150,
                        y: rect.top + window.scrollY
                    });
                    setShowTableMenu(true);
                });
                table.hasTableEventListener = true;
            }
        });
    };

    const handleTableAction = (action) => {
        if (!selectedTable || !editorRef.current || !editorRef.current.contentDocument) return;

        const doc = editorRef.current.contentDocument;

        switch(action) {
            case 'add-row':
                const newRow = doc.createElement('tr');
                const firstRow = selectedTable.querySelector('tr');
                const cellCount = firstRow ? firstRow.cells.length : 0;

                for (let i = 0; i < cellCount; i++) {
                    const cell = doc.createElement('td');
                    cell.style.padding = '8px';
                    cell.style.border = '1px solid #ddd';
                    cell.innerHTML = '&nbsp;';
                    newRow.appendChild(cell);
                }

                selectedTable.appendChild(newRow);
                break;

            case 'add-column':
                const rows = selectedTable.rows;
                for (let i = 0; i < rows.length; i++) {
                    const cell = doc.createElement('td');
                    cell.style.padding = '8px';
                    cell.style.border = '1px solid #ddd';
                    cell.innerHTML = '&nbsp;';
                    rows[i].appendChild(cell);
                }
                break;

            case 'delete-row':
                const currentRowIndex = prompt("Enter row number to delete (starting from 1):", "1");
                if (currentRowIndex && !isNaN(currentRowIndex) && currentRowIndex > 0 && currentRowIndex <= selectedTable.rows.length) {
                    selectedTable.deleteRow(parseInt(currentRowIndex) - 1);
                }
                break;

            case 'delete-column':
                const currentColIndex = prompt("Enter column number to delete (starting from 1):", "1");
                if (currentColIndex && !isNaN(currentColIndex) && currentColIndex > 0) {
                    const colIndex = parseInt(currentColIndex) - 1;
                    const rows = selectedTable.rows;

                    if (rows.length > 0 && colIndex < rows[0].cells.length) {
                        for (let i = 0; i < rows.length; i++) {
                            if (rows[i].cells.length > colIndex) {
                                rows[i].deleteCell(colIndex);
                            }
                        }
                    }
                }
                break;

            case 'delete-table':
                if (confirm("Are you sure you want to delete this table?")) {
                    selectedTable.parentNode.removeChild(selectedTable);
                    setShowTableMenu(false);
                }
                break;
        }

        onChange(editorRef.current.contentDocument.body.innerHTML);
    };

    const handleInsertCode = () => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        editorRef.current.contentDocument.body.focus();

        const codeHtml = '<pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; font-family: monospace;"><code>// Insert code here</code></pre><p><br></p>';
        editorRef.current.contentDocument.execCommand('insertHTML', false, codeHtml);

        setTimeout(() => {
            const codeElement = editorRef.current.contentDocument.querySelector('code');
            if (codeElement) {
                const range = editorRef.current.contentDocument.createRange();
                const selection = editorRef.current.contentDocument.getSelection();
                range.setStart(codeElement, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }, 0);

        onChange(editorRef.current.contentDocument.body.innerHTML);
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to clear all content?")) {
            editorRef.current.contentDocument.body.innerHTML = "";
            onChange("");
            checkActiveFormats();

            if (onCannedResponseAttachmentsChange) {
                onCannedResponseAttachmentsChange([]);
            }
        }
    };

    const handleCannedResponse = (response) => {
        if (!editorRef.current || !editorRef.current.contentDocument) return;

        editorRef.current.contentDocument.body.focus();

        let contentToInsert = '';
        if (response.content_html) {
            contentToInsert = response.content_html;
        } else if (response.content) {
            contentToInsert = response.content;
        }

        if (contentToInsert) {
            editorRef.current.contentDocument.execCommand('insertHTML', false, contentToInsert);
            onChange(editorRef.current.contentDocument.body.innerHTML);
        }

        if (response.attachments && response.attachments.length > 0 && onCannedResponseAttachmentsChange) {
            onCannedResponseAttachmentsChange(response.attachments);
        }

        if (onCannedResponseInserted) {
            onCannedResponseInserted(true);
        }
    };

    const triggerCannedResponseSelector = () => {
        if (cannedResponseBtnRef.current) {
            cannedResponseBtnRef.current.click();
        }
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
                        onClick={handleInsertImage}
                        title="Insert Image"
                        variant="outline"
                        size="icon"
                        className="editor-btn"
                    >
                        <Image size={16} />
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
                    <CannedResponseSelector ref={cannedResponseBtnRef} onSelectResponse={handleCannedResponse} />
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

            {showTableMenu && (
                <div className="table-menu" style={{ top: tableMenuPosition.y, left: tableMenuPosition.x }}>
                    <Button
                        type="button"
                        onClick={() => handleTableAction('add-row')}
                        title="Add Row"
                        variant="outline"
                        size="sm"
                        className="table-menu-btn"
                    >
                        <Plus size={14} /> Row
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleTableAction('add-column')}
                        title="Add Column"
                        variant="outline"
                        size="sm"
                        className="table-menu-btn"
                    >
                        <Plus size={14} /> Column
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleTableAction('delete-row')}
                        title="Delete Row"
                        variant="outline"
                        size="sm"
                        className="table-menu-btn"
                    >
                        <Minus size={14} /> Row
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleTableAction('delete-column')}
                        title="Delete Column"
                        variant="outline"
                        size="sm"
                        className="table-menu-btn"
                    >
                        <Minus size={14} /> Column
                    </Button>
                    <Button
                        type="button"
                        onClick={() => handleTableAction('delete-table')}
                        title="Delete Table"
                        variant="outline"
                        size="sm"
                        className="table-menu-btn danger-btn"
                    >
                        <Trash2 size={14} /> Table
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setShowTableMenu(false)}
                        title="Close"
                        variant="outline"
                        size="sm"
                        className="table-menu-btn close-btn"
                    >
                        <X size={14} />
                    </Button>
                </div>
            )}

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
                        img {
                            max-width: 100%;
                            height: auto;
                            display: block;
                            margin: 8px 0;
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
                        blockquote {
                            border-left: 4px solid #e5e7eb;
                            padding-left: 16px;
                            margin-left: 0;
                            color: #6b7280;
                        }
                        ul, ol {
                            padding-left: 24px;
                        }
                        .command-tooltip {
                            position: absolute;
                            background: #f0f9ff;
                            border: 1px solid #93c5fd;
                            border-radius: 4px;
                            padding: 4px 8px;
                            font-size: 12px;
                            color: #1e40af;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            z-index: 1000;
                            pointer-events: none;
                        }
                        .image-container {
                            position: relative;
                            display: inline-block;
                            max-width: 100%;
                            margin: 8px 0;
                        }
                        .image-container:hover .image-delete-btn {
                            display: flex;
                        }
                        .image-delete-btn {
                            position: absolute;
                            top: 0;
                            right: 0;
                            display: none;
                            align-items: center;
                            justify-content: center;
                            width: 24px;
                            height: 24px;
                            background-color: rgba(239, 68, 68, 0.8);
                            color: white;
                            border: none;
                            border-radius: 50%;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            transform: translate(50%, -50%);
                        }
                        .image-delete-btn:hover {
                            background-color: rgba(220, 38, 38, 1);
                        }
                    `;
                    doc.head.appendChild(style);

                    doc.head.innerHTML += `
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    `;

                    body.contentEditable = 'true';
                    body.dir = 'ltr';

                    let currentCommand = null;
                    let tooltipElement = null;

                    const slashCommands = {
                        '/ol': {
                            tooltip: 'Press <strong>Enter</strong> to create ordered list',
                            action: () => handleFormat('insertOrderedList')
                        },
                        '/ul': {
                            tooltip: 'Press <strong>Enter</strong> to create unordered list',
                            action: () => handleFormat('insertUnorderedList')
                        },
                        '/l': {
                            tooltip: 'Press <strong>Enter</strong> to insert link',
                            action: () => handleInsertLink()
                        },
                        '/img': {
                            tooltip: 'Press <strong>Enter</strong> to insert image',
                            action: () => handleInsertImage()
                        },
                        '/t': {
                            tooltip: 'Press <strong>Enter</strong> to insert table',
                            action: () => handleInsertTable()
                        },
                        '/cd': {
                            tooltip: 'Press <strong>Enter</strong> to insert code block',
                            action: () => handleInsertCode()
                        },
                        '/c': {
                            tooltip: 'Press <strong>Enter</strong> to see canned responses',
                            action: () => triggerCannedResponseSelector()
                        }
                    };

                    const createTooltip = (position, text) => {
                        if (tooltipElement) {
                            removeTooltip();
                        }

                        tooltipElement = doc.createElement('div');
                        tooltipElement.className = 'command-tooltip';
                        tooltipElement.innerHTML = text;

                        tooltipElement.style.left = `${position.x}px`;
                        tooltipElement.style.top = `${position.y + 20}px`;

                        body.appendChild(tooltipElement);
                    };

                    const removeTooltip = () => {
                        if (tooltipElement && tooltipElement.parentNode) {
                            tooltipElement.parentNode.removeChild(tooltipElement);
                            tooltipElement = null;
                        }
                    };

                    const findSlashCommand = (text, position) => {
                        const textBeforeCursor = text.substring(0, position);
                        for (const cmd in slashCommands) {
                            if (textBeforeCursor.endsWith(cmd)) {
                                return {
                                    command: cmd,
                                    startPos: position - cmd.length,
                                    endPos: position
                                };
                            }
                        }

                        return null;
                    };

                    const processSlashCommand = (command) => {
                        const selection = doc.getSelection();
                        if (selection.rangeCount === 0) return;

                        const range = selection.getRangeAt(0);
                        const startNode = range.startContainer;

                        if (startNode.nodeType === Node.TEXT_NODE) {
                            const text = startNode.textContent;
                            const position = range.startOffset;

                            const cmdInfo = findSlashCommand(text, position);
                            if (cmdInfo) {
                                startNode.textContent = text.substring(0, cmdInfo.startPos) + text.substring(cmdInfo.endPos);

                                range.setStart(startNode, cmdInfo.startPos);
                                range.setEnd(startNode, cmdInfo.startPos);
                                selection.removeAllRanges();
                                selection.addRange(range);

                                if (slashCommands[cmdInfo.command]) {
                                    slashCommands[cmdInfo.command].action();
                                }

                                return true;
                            }
                        }

                        return false;
                    };

                    const checkForSlashCommand = () => {
                        const selection = doc.getSelection();
                        if (selection.rangeCount === 0) return null;

                        const range = selection.getRangeAt(0);
                        const startNode = range.startContainer;

                        if (startNode.nodeType === Node.TEXT_NODE) {
                            const text = startNode.textContent;
                            const position = range.startOffset;

                            return findSlashCommand(text, position);
                        }

                        return null;
                    };

                    body.addEventListener('input', (e) => {
                        onChange(body.innerHTML);
                        checkActiveFormats();

                        const cmdInfo = checkForSlashCommand();
                        if (cmdInfo) {
                            currentCommand = cmdInfo.command;

                            const range = doc.getSelection().getRangeAt(0);
                            const rect = range.getBoundingClientRect();

                            createTooltip({
                                x: rect.left,
                                y: rect.bottom
                            }, slashCommands[currentCommand].tooltip);
                        } else {
                            removeTooltip();
                            currentCommand = null;
                        }
                    });

                    body.addEventListener('focus', () => {
                        try {
                            doc.execCommand('defaultParagraphSeparator', false, 'p');
                            doc.execCommand('styleWithCSS', false, true);
                        } catch (e) {}
                        checkActiveFormats();
                    });

                    body.addEventListener('click', (e) => {
                        checkActiveFormats();
                        removeTooltip();
                        currentCommand = null;

                        setupImageEvents();
                        setupTableEvents();
                    });

                    body.addEventListener('keyup', checkActiveFormats);
                    body.addEventListener('mouseup', checkActiveFormats);

                    body.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && currentCommand) {
                            e.preventDefault();
                            processSlashCommand(currentCommand);
                            removeTooltip();
                            currentCommand = null;
                            return;
                        }
                    });

                    setupImageEvents();
                    setupTableEvents();
                }}
            />
        </div>
    );
};

export default RichTextEditor;
