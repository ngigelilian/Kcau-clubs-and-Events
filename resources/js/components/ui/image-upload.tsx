import { ImagePlus, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Single-image upload (cover / logo / banner) ──────────────────────────────

interface SingleImageUploadProps {
    id?: string;
    label?: string;
    hint?: string;
    accept?: string;
    /** Existing URL to show when no new file has been chosen */
    currentUrl?: string | null;
    error?: string;
    className?: string;
    onChange: (file: File | null) => void;
}

export function SingleImageUpload({
    id,
    label,
    hint = 'JPEG, PNG or WebP · max 5 MB',
    accept = 'image/jpeg,image/png,image/webp',
    currentUrl,
    error,
    className,
    onChange,
}: SingleImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleFile = useCallback(
        (file: File | null) => {
            if (file) {
                const url = URL.createObjectURL(file);
                setPreview(url);
                onChange(file);
            }
        },
        [onChange],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files?.[0] ?? null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    };

    const handleClear = () => {
        setPreview(null);
        onChange(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const displayUrl = preview ?? currentUrl;

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}

            <div
                className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                    error ? 'border-destructive bg-destructive/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30',
                    displayUrl ? 'h-48' : 'h-36 cursor-pointer',
                )}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !displayUrl && inputRef.current?.click()}
            >
                {displayUrl ? (
                    <>
                        <img
                            src={displayUrl}
                            alt="Preview"
                            className="h-full w-full rounded-md object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                            >
                                Change
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImagePlus className="h-8 w-8" />
                        <p className="text-sm font-medium">Click or drag to upload</p>
                        <p className="text-xs">{hint}</p>
                    </div>
                )}
            </div>

            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                className="sr-only"
                onChange={handleInputChange}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

// ─── Multi-image upload (merchandise images) ──────────────────────────────────

interface MultiImageUploadProps {
    id?: string;
    label?: string;
    hint?: string;
    accept?: string;
    /** Existing image URLs from the server */
    currentUrls?: string[];
    error?: string;
    className?: string;
    maxFiles?: number;
    onChange: (files: File[]) => void;
}

export function MultiImageUpload({
    id,
    label,
    hint = 'JPEG, PNG or WebP · max 5 MB each · up to 5 images',
    accept = 'image/jpeg,image/png,image/webp',
    currentUrls = [],
    error,
    className,
    maxFiles = 5,
    onChange,
}: MultiImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    const handleFiles = useCallback(
        (newFiles: File[]) => {
            const combined = [...files, ...newFiles].slice(0, maxFiles);
            const urls = combined.map((f) => URL.createObjectURL(f));
            setFiles(combined);
            setPreviews(urls);
            onChange(combined);
        },
        [files, maxFiles, onChange],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(Array.from(e.target.files ?? []));
        if (inputRef.current) inputRef.current.value = '';
    };

    const removePreview = (index: number) => {
        const updated = files.filter((_, i) => i !== index);
        const urls = updated.map((f) => URL.createObjectURL(f));
        setFiles(updated);
        setPreviews(urls);
        onChange(updated);
    };

    // Show new previews if selected, otherwise show existing server URLs
    const displayUrls = previews.length > 0 ? previews : currentUrls;
    const isNewSelection = previews.length > 0;

    return (
        <div className={cn('space-y-2', className)}>
            {label && (
                <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}

            {/* Preview grid */}
            {displayUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {displayUrls.map((url, i) => (
                        <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
                            <img src={url} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                            {isNewSelection && (
                                <button
                                    type="button"
                                    onClick={() => removePreview(i)}
                                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload area */}
            {(!isNewSelection || files.length < maxFiles) && (
                <div
                    className={cn(
                        'flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                        error ? 'border-destructive bg-destructive/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30',
                    )}
                    onClick={() => inputRef.current?.click()}
                >
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImagePlus className="h-6 w-6" />
                        <p className="text-xs font-medium">
                            {isNewSelection ? `Add more (${files.length}/${maxFiles})` : 'Click to upload images'}
                        </p>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground">{hint}</p>

            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                multiple
                className="sr-only"
                onChange={handleInputChange}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
