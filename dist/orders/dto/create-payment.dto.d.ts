import { StudentInfoDto } from './student-info.dto';
export declare class CreatePaymentDto {
    school_id: string;
    trustee_id?: string;
    student_info: StudentInfoDto;
    amount: number;
    callback_url: string;
}
