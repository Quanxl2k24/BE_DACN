import { Module } from "@nestjs/common";
import { CandidatesService } from "./candidates.service";
import { CandidatesController } from "./candidates.controller";
import { AuthModule } from "src/auth/auth.module";
import { ApplicationModule } from "src/application/application.module";
import { EmailModule } from "src/email/email.module";

@Module({
    imports: [AuthModule, ApplicationModule, EmailModule],
    controllers: [CandidatesController],
    providers: [CandidatesService]
})

export class CandidatesModule { }