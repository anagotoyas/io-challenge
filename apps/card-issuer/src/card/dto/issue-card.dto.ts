import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CustomerDto {
  @ApiProperty({ example: 'DNI' })
  @IsEnum(['DNI'], { message: 'documentType debe ser DNI' })
  documentType: string;

  @ApiProperty({ example: '74851236' })
  @Matches(/^\d{8}$/, {
    message: 'documentNumber debe tener exactamente 8 dígitos',
  })
  documentNumber: string;

  @ApiProperty({ example: 'Maria Quispe' })
  @IsString()
  @IsNotEmpty({ message: 'fullName no puede estar vacío' })
  fullName: string;

  @ApiProperty({ example: 28 })
  @IsInt()
  @Min(18, { message: 'El cliente debe ser mayor de edad' })
  @Max(100)
  age: number;

  @ApiProperty({ example: 'maria@gmail.com' })
  @IsEmail({}, { message: 'email inválido' })
  email: string;
}

export class ProductDto {
  @ApiProperty({ example: 'VISA' })
  @IsEnum(['VISA'], { message: 'type debe ser VISA' })
  type: string;

  @ApiProperty({ example: 'PEN' })
  @IsEnum(['PEN', 'USD'], { message: 'currency debe ser PEN o USD' })
  currency: string;
}

export class IssueCardDto {
  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ type: ProductDto })
  @ValidateNested()
  @Type(() => ProductDto)
  product: ProductDto;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  forceError?: boolean;
}
