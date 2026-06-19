import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ApiWrappedErrorResponses,
  ApiWrappedResponse,
} from '../../common/decorators/api-wrapped-response.decorator';

import { TopicsService } from './topics.service';
import { TopicDtoResponse } from './dtos/response/topic.dto';

@ApiTags('Topics')
@Controller({ path: 'topics', version: '1' })
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get one topic',
    description: 'Returns a single topic by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Topic ID',
    example: 'html-basics',
  })
  @ApiWrappedResponse(TopicDtoResponse, {
    status: 200,
    description: 'Topic returned successfully',
  })
  @ApiWrappedErrorResponses()
  async findOne(@Param('id') id: string): Promise<TopicDtoResponse> {
    return await this.topicsService.findByTopicId(id);
  }
}
