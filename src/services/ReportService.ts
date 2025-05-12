import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AmazonReport } from '../models/AmazonReport';
import logger from '../config/logger';

export class ReportService {
    private reportRepository: Repository<AmazonReport>;

    constructor() {
        this.reportRepository = AppDataSource.getRepository(AmazonReport);
    }

    async saveReport(reportData: {
        reportId: string;
        reportType: string;
        marketplaceIds: string[];
        dateStartTime?: string;
        dateEndTime?: string;
        reportDocumentId?: string;
        processingStatus?: string;
    }): Promise<AmazonReport> {
        try {
            // First check if report exists
            let report = await this.reportRepository.findOne({ 
                where: { reportId: reportData.reportId } 
            });

            if (report) {
                // Update existing report
                Object.assign(report, reportData);
            } else {
                // Create new report
                report = new AmazonReport();
                Object.assign(report, reportData);
            }

            const savedReport = await this.reportRepository.save(report);
            logger.info(`Saved report ${reportData.reportId} to database`);
            return savedReport;
        } catch (error) {
            logger.error(`Error saving report ${reportData.reportId}:`, error);
            throw error;
        }
    }

    async getReport(reportId: string): Promise<AmazonReport | null> {
        return this.reportRepository.findOne({ where: { reportId } });
    }

    async getAllReports(): Promise<AmazonReport[]> {
        return this.reportRepository.find();
    }
} 