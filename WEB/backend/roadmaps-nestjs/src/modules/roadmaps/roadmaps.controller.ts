import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RoadmapsService } from './roadmaps.service';
import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { RoadmapTreeDtoResponse } from './dtos/response/roadmapTree.dto';
import {
  ApiWrappedErrorResponses,
  ApiWrappedResponse,
} from 'src/common/decorators/api-wrapped-response.decorator';
import { RoadmapResponseDto } from './dtos/response/roadmap.dto';

@ApiTags('Roadmaps')
@Controller({ path: 'roadmaps', version: '1' })
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get one roadmap',
    description: 'Returns a single roadmap tree by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Roadmap ID.',
    example: 'frontend-roadmap',
  })
  @ApiWrappedResponse(RoadmapTreeDtoResponse, {
    status: 200,
    description: 'Roadmap returned successfully.',
  })
  async findRoadmapTree(
    @Param('id') id: string,
  ): Promise<RoadmapTreeDtoResponse> {
    return await this.roadmapsService.getRoadmapTree(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List roadmaps',
    description: 'Returns all roadmaps in the system.',
  })
  @ApiWrappedResponse(RoadmapResponseDto, {
    status: 200,
    description: 'Array of roadmaps returned successfully.',
    isArray: true,
  })
  @ApiWrappedErrorResponses()
  async findAll(): Promise<RoadmapResponseDto[]> {
    return await this.roadmapsService.findAll();
  }
}
