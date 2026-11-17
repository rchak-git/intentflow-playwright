import path from 'node:path';
import type { Scalar, StepParams, SubIntent } from '../types/intentSchema';
import { BaseControl } from './baseControl';

export class FileUploadControl extends BaseControl {
  public override async populate(value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if (params) this.setParams(params);
    const targetParams = params ?? this.params;
    const filePath = value !== undefined ? value : targetParams?.value;
    if (typeof filePath !== 'string' || !filePath.trim()) {
      throw new Error('[IntentFlow] FILE_UPLOAD requires a non-empty file path string.');
    }
    if (targetParams?.subIntent && targetParams.subIntent !== 'setValue') {
      throw new Error(`[IntentFlow] FILE_UPLOAD does not support '${targetParams.subIntent}'.`);
    }
    await this.ensureFrameReady();
    await this.locator.setInputFiles(path.resolve(process.cwd(), filePath), { timeout: targetParams?.timeout });
  }

  public override async action(): Promise<void> {
    throw new Error('[IntentFlow] FILE_UPLOAD does not support action.');
  }

  public override async verify(subIntent: SubIntent = 'equals', value?: Scalar | Scalar[], params?: StepParams): Promise<void> {
    if ((params?.subIntent ?? subIntent) !== 'state') {
      throw new Error('[IntentFlow] FILE_UPLOAD only supports state verification.');
    }
    await super.verify(subIntent, value, params);
  }

  public override async getValue(): Promise<string> {
    throw new Error('[IntentFlow] FILE_UPLOAD does not support extract.');
  }
}
