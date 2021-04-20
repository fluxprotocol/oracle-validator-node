import { Outcome } from "./DataRequestOutcome";

export interface ResolutionWindow {
    round: number;
    bondedOutcome?: Outcome;
    endTime: Date;
    bondSize: string;
}
