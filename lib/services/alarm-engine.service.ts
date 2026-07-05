import type { Repositories } from "@/lib/repositories";
import { BaseService } from "./base.service";

export interface AlarmToneProfile {
  label: string;
  sound: string;
  fullscreen: boolean;
}

export class AlarmEngineService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  toneForCategory(category: string | null): AlarmToneProfile {
    switch ((category ?? "").toLowerCase()) {
      case "academic":
        return { label: "Bell", sound: "bell", fullscreen: false };
      case "business":
        return { label: "Professional", sound: "ping", fullscreen: false };
      case "health":
        return { label: "Motivational", sound: "pulse", fullscreen: true };
      case "relationship":
        return { label: "Gentle", sound: "soft-chime", fullscreen: false };
      default:
        return { label: "Standard", sound: "chime", fullscreen: false };
    }
  }
}
