import { New_Rocker } from "next/font/google";
import styles from "./page.module.css";

const newRocker = New_Rocker({
  subsets: ["latin"],
  weight: "400",
});

export default function Home() {
  return (
    <main className={styles.screen}>
      <div className={styles.content}>
        <div className={styles.titleBlock}>
          <h1 className={`${styles.title} ${newRocker.className}`}>AniSauce</h1>
          <p className={styles.tagline}>anime source finder</p>
        </div>
        <p className={styles.instructions}>
          browse, drop, or ctrl + v to paste a screenshot~
        </p>
        <div className={styles.inputRow}>
          <span className={styles.folderIcon} aria-hidden="true">
            <i className="fa-solid fa-folder-open" />
          </span>
          <input
            className={styles.input}
            type="text"
            placeholder="paste image url"
            aria-label="Paste image URL"
          />
        </div>
      </div>
    </main>
  );
}
