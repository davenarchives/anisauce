import { New_Rocker } from "next/font/google";
import styles from "@/app/page.module.css";

const newRocker = New_Rocker({
  subsets: ["latin"],
  weight: "400",
});

type SearchHeroProps = {
  title: string;
  tagline: string;
  instructions: string;
};

export function SearchHero({ title, tagline, instructions }: SearchHeroProps) {
  return (
    <>
      <div className={styles.titleBlock}>
        <h1 className={`${styles.title} ${newRocker.className}`}>{title}</h1>
        <p className={styles.tagline}>{tagline}</p>
      </div>
      <p className={styles.instructions}>{instructions}</p>
    </>
  );
}
