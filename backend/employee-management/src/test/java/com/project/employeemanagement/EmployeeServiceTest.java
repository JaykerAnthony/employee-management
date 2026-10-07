package com.project.employeemanagement;

import com.project.employeemanagement.model.Employee;
import com.project.employeemanagement.repository.EmployeeRepository;
import com.project.employeemanagement.service.EmployeeService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void savesEmployee() {
        Employee employee = new Employee("Ada", "Lovelace", "ada@example.com", "Engineering");
        when(employeeRepository.save(employee)).thenReturn(employee);

        assertEquals(employee, employeeService.save(employee));
        verify(employeeRepository).save(employee);
    }

    @Test
    void returnsNotFoundWhenEmployeeDoesNotExist() {
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> employeeService.findById(99L));

        assertEquals(404, exception.getStatusCode().value());
    }
}
