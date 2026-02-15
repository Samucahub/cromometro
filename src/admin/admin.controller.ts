import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('users')
  listUsers() {
    return this.service.listUsers();
  }

  @Patch('users/:id')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.service.updateUserRole(id, dto.role, currentUser.id);
  }

  @Delete('users/:id')
  delete(
    @Param('id') id: string,
    @Body() dto: DeleteUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.service.deleteUser(id, currentUser.id, dto.confirmed);
  }
}
