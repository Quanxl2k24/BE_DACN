import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { AccessTokenGuard } from "src/auth/guard/access-token.guard";
import { RolesGuard } from "src/auth/guard/roles.guard";
import { Roles } from "src/auth/decorator/roles.decorator";
import { UpdateApplicationStatusDTO } from "src/application/dto/update-application-status.dto";
import { CandidatesService } from "./candidates.service";
import { QueryCandidatesDTO } from "./dto/query-candidates.dto";
import { CreateInterviewDTO } from "./dto/create-interview.dto";
import { QueryInterviewsDTO } from "./dto/query-interviews.dto";
import { UpdateInterviewResultDTO } from "./dto/update-interview-result.dto";
import { CreateOfferDTO } from "./dto/create-offer.dto";

@ApiTags('Candidates - Ứng viên')
@Controller('candidates')
export class CandidatesController {
    constructor(private candidatesService: CandidatesService) { }

    @Get('manage/:companyId')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiOperation({
        summary: 'Danh sách ứng viên',
        description: 'Lấy danh sách ứng viên đã ứng tuyển vào công ty. Hỗ trợ tìm kiếm theo tên, lọc theo trạng thái đơn, lọc theo tin tuyển dụng cụ thể hoặc chỉ các tin còn thời hạn.',
    })
    getCandidates(
        @Param('companyId') companyId: string,
        @Query() query: QueryCandidatesDTO,
        @Req() req: Request,
    ) {
        return this.candidatesService.getCandidates(companyId, req.user!, query);
    }

    @Patch('manage/:companyId/:applicationId/status')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiParam({ name: 'applicationId', description: 'ID đơn ứng tuyển' })
    @ApiOperation({
        summary: 'Cập nhật trạng thái ứng viên',
        description: 'Cập nhật trạng thái xử lý đơn ứng tuyển của ứng viên (đạt yêu cầu, đặt lịch phỏng vấn, từ chối...).',
    })
    updateStatus(
        @Param('companyId') companyId: string,
        @Param('applicationId') applicationId: string,
        @Body() body: UpdateApplicationStatusDTO,
        @Req() req: Request,
    ) {
        return this.candidatesService.updateCandidateStatus(companyId, applicationId, body, req.user!);
    }

    @Post('manage/:companyId/interviews')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiOperation({
        summary: 'Đặt lịch phỏng vấn',
        description: 'Đặt lịch phỏng vấn cho ứng viên đã đạt yêu cầu. Tự động chuyển trạng thái đơn ứng tuyển sang INTERVIEW nếu chưa ở trạng thái này.',
    })
    scheduleInterview(
        @Param('companyId') companyId: string,
        @Body() body: CreateInterviewDTO,
        @Req() req: Request,
    ) {
        return this.candidatesService.scheduleInterview(companyId, body, req.user!);
    }

    @Get('manage/:companyId/interviews')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiOperation({
        summary: 'Danh sách lịch phỏng vấn',
        description: 'Lấy danh sách các lịch phỏng vấn đã đặt cho công ty, phân trang theo cursor.',
    })
    getInterviews(
        @Param('companyId') companyId: string,
        @Query() query: QueryInterviewsDTO,
        @Req() req: Request,
    ) {
        return this.candidatesService.getInterviews(companyId, req.user!, query);
    }

    @Patch('manage/:companyId/interviews/:interviewId/result')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiParam({ name: 'interviewId', description: 'ID lịch phỏng vấn' })
    @ApiOperation({
        summary: 'Cập nhật kết quả phỏng vấn',
        description: 'Đánh dấu ứng viên Đạt hoặc Trượt sau khi phỏng vấn xong. Tự động cập nhật trạng thái đơn ứng tuyển (OFFERED/REJECTED) và đánh dấu lịch phỏng vấn đã hoàn thành.',
    })
    updateInterviewResult(
        @Param('companyId') companyId: string,
        @Param('interviewId') interviewId: string,
        @Body() body: UpdateInterviewResultDTO,
        @Req() req: Request,
    ) {
        return this.candidatesService.updateInterviewResult(companyId, interviewId, body, req.user!);
    }

    @Put('manage/:companyId/:applicationId/offer')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiParam({ name: 'applicationId', description: 'ID đơn ứng tuyển' })
    @ApiOperation({
        summary: 'Gửi / cập nhật lời mời nhận việc',
        description: 'Tạo hoặc cập nhật lời mời nhận việc (lương, ngày bắt đầu, hạn phản hồi, ghi chú) cho một đơn ứng tuyển đang ở trạng thái Offer. Không chỉnh sửa được sau khi ứng viên đã phản hồi.',
    })
    createOrUpdateOffer(
        @Param('companyId') companyId: string,
        @Param('applicationId') applicationId: string,
        @Body() body: CreateOfferDTO,
        @Req() req: Request,
    ) {
        return this.candidatesService.createOrUpdateOffer(companyId, applicationId, body, req.user!);
    }

    @Get('manage/:companyId/:applicationId/offer')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiParam({ name: 'applicationId', description: 'ID đơn ứng tuyển' })
    @ApiOperation({
        summary: 'Xem lời mời nhận việc',
        description: 'Xem chi tiết lời mời nhận việc của một đơn ứng tuyển (trả về null nếu chưa gửi lời mời).',
    })
    getOffer(
        @Param('companyId') companyId: string,
        @Param('applicationId') applicationId: string,
        @Req() req: Request,
    ) {
        return this.candidatesService.getOffer(companyId, applicationId, req.user!);
    }

    @Get('manage/:companyId/dashboard')
    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles('RECRUITER')
    @ApiBearerAuth()
    @ApiParam({ name: 'companyId', description: 'ID công ty' })
    @ApiOperation({
        summary: 'Thống kê dashboard tuyển dụng',
        description: 'Thống kê tình hình tuyển dụng của công ty: số tin đang tuyển, số hồ sơ nhận được, số lịch phỏng vấn trong tuần, tỷ lệ ứng viên đỗ, và danh sách ứng viên đã đỗ. Chỉ dành cho nhà tuyển dụng (RECRUITER).',
    })
    getDashboard(
        @Param('companyId') companyId: string,
        @Req() req: Request,
    ) {
        return this.candidatesService.getDashboard(companyId, req.user!);
    }
}
