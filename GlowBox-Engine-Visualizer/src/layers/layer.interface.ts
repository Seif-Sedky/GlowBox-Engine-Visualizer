import { ComponentType } from 'react';
import { Diff } from '../engine/diff.types';

export interface VisualizationLayer {
  id: string;
  label: string;
  component: ComponentType;
  onDiff?: (diff: Diff) => any;
}
