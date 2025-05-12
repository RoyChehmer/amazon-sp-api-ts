import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { AmazonDocument } from '../models/AmazonDocument';
import logger from '../config/logger';

export class DocumentService {
    private documentRepository: Repository<AmazonDocument>;

    constructor() {
        this.documentRepository = AppDataSource.getRepository(AmazonDocument);
    }

    async saveDocument(documentData: {
        reportId: string;
        reportDocumentId: string;
        headers: string[];
        records: Record<string, string>[];
    }): Promise<AmazonDocument[]> {
        try {
            const savedDocuments: AmazonDocument[] = [];
            
            // Save each record separately
            for (let i = 0; i < documentData.records.length; i++) {
                const document = this.documentRepository.create({
                    reportId: documentData.reportId,
                    reportDocumentId: documentData.reportDocumentId,
                    headers: documentData.headers,
                    record: documentData.records[i],
                    recordIndex: i
                });
                
                const savedDocument = await this.documentRepository.save(document);
                savedDocuments.push(savedDocument);
            }

            logger.info(`Saved ${savedDocuments.length} records for report ${documentData.reportId}`);
            return savedDocuments;
        } catch (error) {
            logger.error(`Error saving document for report ${documentData.reportId}:`, error);
            throw error;
        }
    }

    async getDocumentRecords(reportId: string): Promise<AmazonDocument[]> {
        return this.documentRepository.find({ 
            where: { reportId },
            order: { recordIndex: 'ASC' }
        });
    }

    async getAllDocuments(): Promise<AmazonDocument[]> {
        return this.documentRepository.find();
    }
} 