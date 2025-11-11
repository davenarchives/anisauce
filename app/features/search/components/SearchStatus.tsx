import styles from "@/app/page.module.css";

type SearchStatusProps = {
  status: string;
  error: string | null;
  loading: boolean;
};

export function SearchStatus({ status, error, loading }: SearchStatusProps) {
  return (
    <>
      {status && <p className={styles.status}>{status}</p>}
      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.loading}>searching the multiverse...</p>}
    </>
  );
}
