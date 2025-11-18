import React from 'react';
import styles from '../styles/RayBackground.module.css';

interface RayBackgroundProps {
  theme?: 'light' | 'dark';
}

export const RayBackground: React.FC<RayBackgroundProps> = ({ theme = 'light' }) => {
  return (
    <div className={styles.rayContainer} data-theme={theme}>
      <div className={`${styles.lightRay} ${styles.ray1}`} data-theme={theme} />
      <div className={`${styles.lightRay} ${styles.ray2}`} data-theme={theme} />
      <div className={`${styles.lightRay} ${styles.ray3}`} data-theme={theme} />
      <div className={`${styles.lightRay} ${styles.ray4}`} data-theme={theme} />
      <div className={`${styles.lightRay} ${styles.ray5}`} data-theme={theme} />
      <div className={`${styles.lightRay} ${styles.ray6}`} data-theme={theme} />
      <div className={`${styles.lightRay} ${styles.ray7}`} data-theme={theme} />
      <div className={`${styles.lightRay} ${styles.ray8}`} data-theme={theme} />
    </div>
  );
};