import type {
  ChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
  FormEvent,
  RefObject,
} from "react";
import styles from "@/app/page.module.css";

type SearchFormProps = {
  urlValue: string;
  dragActive: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPaste: (event: ReactClipboardEvent<HTMLInputElement>) => void;
  onBrowseClick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: RefObject<HTMLInputElement>;
};

export function SearchForm({
  urlValue,
  dragActive,
  onUrlChange,
  onSubmit,
  onPaste,
  onBrowseClick,
  onFileChange,
  fileInputRef,
}: SearchFormProps) {
  return (
    <form
      className={`${styles.inputRow} ${dragActive ? styles.inputRowActive : ""}`}
      onSubmit={onSubmit}
    >
      <button
        type="button"
        className={styles.folderButton}
        onClick={onBrowseClick}
        aria-label="Browse for an image"
      >
        <i className="fa-solid fa-folder-open" aria-hidden="true" />
      </button>
      <div className={styles.inputShell}>
        <input
          className={styles.urlInput}
          type="text"
          placeholder="paste image url"
          value={urlValue}
          onChange={(event) => onUrlChange(event.target.value)}
          onPaste={onPaste}
          aria-label="Paste image URL"
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={onFileChange}
      />
    </form>
  );
}
