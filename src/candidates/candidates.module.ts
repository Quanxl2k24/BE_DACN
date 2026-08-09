import { Module } from "@nestjs/common";
import { CandidatesService } from "./candidates.service";
import { CandidatesController } from "./candidates.controller";
import { AuthModule } from "src/auth/auth.module";
import { ApplicationModule } from "src/application/application.module";

@Module({
    imports: [AuthModule, ApplicationModule],
    controllers: [CandidatesController],
    providers: [CandidatesService]
})

export class CandidatesModule { }