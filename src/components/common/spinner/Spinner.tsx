import React from 'react';

import styles from './Spinner.module.scss';

interface IProps {
  size: number | string
}

export default function Spinner({ size }: IProps) {
  return (<div className={styles.Spinner}>

  </div>)
}