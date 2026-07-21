import Image from "next/image";
import styles from "./landing.module.scss";

export function BrandMark({ size = 36 }) {
  return (
    <Image
      src="/images/brand/commitdiary-mark.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={styles.brandMark}
      style={{ width: size, height: size }}
      unoptimized
    />
  );
}

export function BrandLockup({ showTagline = true }) {
  return (
    <span className={styles.brandLockup}>
      <BrandMark />
      <span>
        <strong>CommitDiary</strong>
        {showTagline ? <small>Work journal for developers</small> : null}
      </span>
    </span>
  );
}
