import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { MarketplaceParticipation } from '../models/MarketplaceParticipation';
import logger from '../config/logger';

export class MarketplaceService {
    private marketplaceRepository: Repository<MarketplaceParticipation>;

    constructor() {
        this.marketplaceRepository = AppDataSource.getRepository(MarketplaceParticipation);
    }

    async saveMarketplaceParticipations(data: any): Promise<MarketplaceParticipation[]> {
        try {
            logger.info('Raw marketplace data:', JSON.stringify(data, null, 2));
            
            // The payload is an array directly
            const participations = data.payload || [];
            logger.info('Participations array:', JSON.stringify(participations, null, 2));
            
            if (!participations || participations.length === 0) {
                logger.warning('No marketplace participations found in the response');
                return [];
            }

            const savedParticipations: MarketplaceParticipation[] = [];

            for (const participation of participations) {
                const marketplace = participation.marketplace;
                const storeName = participation.storeName;

                if (!marketplace || !marketplace.id) {
                    logger.warning('Invalid marketplace data:', JSON.stringify(participation, null, 2));
                    continue;
                }

                logger.info('Processing marketplace:', JSON.stringify(marketplace, null, 2));
                logger.info('Processing store name:', storeName);

                const marketplaceData = this.marketplaceRepository.create({
                    marketplaceId: marketplace.id,
                    name: marketplace.name,
                    countryCode: marketplace.countryCode,
                    defaultLanguageCode: marketplace.defaultLanguageCode,
                    defaultCurrencyCode: marketplace.defaultCurrencyCode,
                    domainName: marketplace.domainName,
                    sellerName: storeName,
                    additionalInfo: participation
                });

                const saved = await this.marketplaceRepository.save(marketplaceData);
                savedParticipations.push(saved);
                logger.info(`Saved marketplace participation for ${marketplace.name} (ID: ${marketplace.id})`);
            }

            logger.info(`Successfully saved ${savedParticipations.length} marketplace participations`);
            return savedParticipations;
        } catch (error) {
            logger.error('Error saving marketplace participations:', error);
            throw error;
        }
    }

    async getAllMarketplaces(): Promise<MarketplaceParticipation[]> {
        return this.marketplaceRepository.find();
    }

    async getMarketplaceById(marketplaceId: string): Promise<MarketplaceParticipation | null> {
        return this.marketplaceRepository.findOne({ where: { marketplaceId } });
    }
} 