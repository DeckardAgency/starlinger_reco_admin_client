// text-editor.component.ts
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, OnChanges, SecurityContext, SimpleChanges, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-text-editor',
    imports: [CommonModule, FormsModule],
    templateUrl: './text-editor.component.html',
    styleUrls: ['./text-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextEditorComponent implements OnInit, OnChanges, OnDestroy {
    @Input() placeholder: string = 'Start typing.';
    @Input() initialContent: string | null = '';
    @Output() contentChange = new EventEmitter<string>();

    @ViewChild('editor', { static: true }) editorElement!: ElementRef;

    textStyles: { value: string, label: string }[] = [
        { value: 'normal', label: 'Normal' },
        { value: 'h1', label: 'Heading 1' },
        { value: 'h2', label: 'Heading 2' },
        { value: 'h3', label: 'Heading 3' },
        { value: 'pre', label: 'Code' },
        { value: 'blockquote', label: 'Quote' }
    ];

    fontSizes: { value: string, label: string }[] = [
        { value: '1', label: 'Small' },
        { value: '2', label: 'Medium' },
        { value: '3', label: 'Large' },
        { value: '4', label: 'X-Large' },
        { value: '5', label: 'XX-Large' }
    ];

    selectedStyle: string = 'normal';
    selectedSize: string = '3';
    isFullscreen: boolean = false;

    // Format states
    isBold: boolean = false;
    isItalic: boolean = false;
    isUnderline: boolean = false;
    currentAlignment: string = 'left';

    private initialized = false;
    private selectionChangeHandler = () => this.onSelectionChange();

    constructor(
        private sanitizer: DomSanitizer,
        private zone: NgZone,
        private cdr: ChangeDetectorRef
    ) {}

    /** Strip dangerous markup (scripts, event handlers, etc.) from stored rich text
     *  before it is written to the DOM via innerHTML, keeping only safe formatting. */
    private sanitizeHtml(html: string | null | undefined): string {
        return this.sanitizer.sanitize(SecurityContext.HTML, html ?? '') ?? '';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialContent'] && this.initialized && !changes['initialContent'].firstChange) {
            const newContent = changes['initialContent'].currentValue || '';
            const currentContent = this.editorElement.nativeElement.innerHTML;
            if (newContent && !currentContent) {
                this.editorElement.nativeElement.innerHTML = this.sanitizeHtml(newContent);
            }
        }
    }

    ngOnInit(): void {
        this.initialized = true;
        if (this.initialContent) {
            this.editorElement.nativeElement.innerHTML = this.sanitizeHtml(this.initialContent);
        }
        this.editorElement.nativeElement.addEventListener('input', () => {
            this.emitContentChange();
        });

        // Add selection change listener to update format states
        this.editorElement.nativeElement.addEventListener('mouseup', this.updateFormatState.bind(this));
        this.editorElement.nativeElement.addEventListener('keyup', this.updateFormatState.bind(this));
        this.editorElement.nativeElement.addEventListener('click', this.updateFormatState.bind(this));

        // document:selectionchange fires for selections anywhere on the page.
        // Listen outside Angular so it doesn't trigger zone change detection;
        // updateFormatState() re-enters the zone only when state actually changed.
        this.zone.runOutsideAngular(() => {
            document.addEventListener('selectionchange', this.selectionChangeHandler);
        });
    }

    ngOnDestroy(): void {
        document.removeEventListener('selectionchange', this.selectionChangeHandler);
    }

    onSelectionChange(): void {
        // Only update if our editor has focus
        if (document.activeElement === this.editorElement.nativeElement ||
            this.editorElement.nativeElement.contains(document.activeElement)) {
            this.updateFormatState();
        }
    }

    updateFormatState(): void {
        const isBold = document.queryCommandState('bold');
        const isItalic = document.queryCommandState('italic');
        const isUnderline = document.queryCommandState('underline');

        // Check for alignment
        let currentAlignment = this.currentAlignment;
        if (document.queryCommandState('justifyLeft')) {
            currentAlignment = 'left';
        } else if (document.queryCommandState('justifyCenter')) {
            currentAlignment = 'center';
        } else if (document.queryCommandState('justifyRight')) {
            currentAlignment = 'right';
        } else if (document.queryCommandState('justifyFull')) {
            currentAlignment = 'full';
        }

        // Check current block format
        let selectedStyle = this.selectedStyle;
        const formatBlock = document.queryCommandValue('formatBlock').toLowerCase();
        if (formatBlock) {
            // Remove the < > if they exist (browsers can return values differently)
            const cleanFormat = formatBlock.replace(/[<>]/g, '');
            selectedStyle = this.textStyles.find(style => style.value === cleanFormat)
                ? cleanFormat
                : 'normal';
        }

        // Check current font size
        let selectedSize = this.selectedSize;
        const fontSize = document.queryCommandValue('fontSize');
        if (fontSize) {
            selectedSize = fontSize;
        }

        const changed =
            isBold !== this.isBold ||
            isItalic !== this.isItalic ||
            isUnderline !== this.isUnderline ||
            currentAlignment !== this.currentAlignment ||
            selectedStyle !== this.selectedStyle ||
            selectedSize !== this.selectedSize;

        if (!changed) {
            return;
        }

        this.isBold = isBold;
        this.isItalic = isItalic;
        this.isUnderline = isUnderline;
        this.currentAlignment = currentAlignment;
        this.selectedStyle = selectedStyle;
        this.selectedSize = selectedSize;

        // May be called from a listener registered outside Angular, so re-enter
        // the zone to schedule change detection for this OnPush component.
        this.zone.run(() => this.cdr.markForCheck());
    }

    execCommand(command: string, value: string | undefined = undefined): void {
        document.execCommand(command, false, value);
        this.editorElement.nativeElement.focus();
        this.emitContentChange();
        this.updateFormatState();
    }

    formatText(style: string): void {
        switch (style) {
            case 'bold':
                this.execCommand('bold');
                break;
            case 'italic':
                this.execCommand('italic');
                break;
            case 'underline':
                this.execCommand('underline');
                break;
            default:
                break;
        }
    }

    createList(type: string): void {
        if (type === 'ordered') {
            this.execCommand('insertOrderedList');
        } else {
            this.execCommand('insertUnorderedList');
        }
    }

    alignText(alignment: string): void {
        this.execCommand('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1));
        this.currentAlignment = alignment;
    }

    insertLink(): void {
        const url = prompt('Enter URL:');
        if (url && this.isValidUrl(url)) {
            this.execCommand('createLink', url);
        }
    }

    insertImage(): void {
        const url = prompt('Enter image URL:');
        if (url && this.isValidUrl(url)) {
            this.execCommand('insertImage', url);
        }
    }

    private isValidUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    changeTextStyle(): void {
        // Remove previous formatting
        this.execCommand('removeFormat');

        // Apply new style
        if (this.selectedStyle !== 'normal') {
            this.execCommand('formatBlock', `<${this.selectedStyle}>`);
        } else {
            this.execCommand('formatBlock', '<p>');
        }
    }

    changeFontSize(): void {
        this.execCommand('fontSize', this.selectedSize);
    }

    toggleFullscreen(): void {
        this.isFullscreen = !this.isFullscreen;
    }

    emitContentChange(): void {
        this.contentChange.emit(this.editorElement.nativeElement.innerHTML);
    }

    getContent(): string {
        return this.editorElement.nativeElement.innerHTML;
    }

    setContent(html: string): void {
        this.editorElement.nativeElement.innerHTML = this.sanitizeHtml(html);
        this.emitContentChange();
    }
}
