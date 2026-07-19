package com.tasaheel.service;

import com.tasaheel.dto.CustomerCarDTO;
import com.tasaheel.dto.CustomerDTO;
import com.tasaheel.entity.Customer;
import com.tasaheel.entity.CustomerCar;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.CustomerCarRepository;
import com.tasaheel.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerCarRepository customerCarRepository;

    public CustomerDTO getProfile(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        return toCustomerDTO(customer);
    }

    public CustomerDTO updateProfile(Long id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        if (dto.getName() != null) customer.setName(dto.getName());
        if (dto.getCity() != null) customer.setCity(dto.getCity());
        if (dto.getEmail() != null) customer.setEmail(dto.getEmail());
        if (dto.getAvatar() != null) customer.setAvatar(dto.getAvatar());
        if (dto.getFcmToken() != null) customer.setFcmToken(dto.getFcmToken());
        if (dto.getPhone() != null) customer.setPhone(dto.getPhone());

        customer = customerRepository.save(customer);
        return toCustomerDTO(customer);
    }

    public List<CustomerCarDTO> getCars(Long customerId) {
        return customerCarRepository.findByCustomerId(customerId).stream()
                .map(this::toCustomerCarDTO)
                .collect(Collectors.toList());
    }

    public CustomerCarDTO addCar(Long customerId, CustomerCarDTO dto) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));

        CustomerCar car = CustomerCar.builder()
                .customer(customer)
                .make(dto.getMake())
                .model(dto.getModel())
                .year(dto.getYear())
                .plateNumber(dto.getPlateNumber())
                .color(dto.getColor())
                .mileage(dto.getMileage())
                .nextOilChangeDate(dto.getNextOilChangeDate())
                .nextOilChangeMileage(dto.getNextOilChangeMileage())
                .nextAppointmentDate(dto.getNextAppointmentDate())
                .build();

        car = customerCarRepository.save(car);
        return toCustomerCarDTO(car);
    }

    public CustomerCarDTO updateCar(Long carId, CustomerCarDTO dto) {
        CustomerCar car = customerCarRepository.findById(carId)
                .orElseThrow(() -> new ResourceNotFoundException("Car", carId));

        if (dto.getMake() != null) car.setMake(dto.getMake());
        if (dto.getModel() != null) car.setModel(dto.getModel());
        if (dto.getYear() != null) car.setYear(dto.getYear());
        if (dto.getPlateNumber() != null) car.setPlateNumber(dto.getPlateNumber());
        if (dto.getColor() != null) car.setColor(dto.getColor());
        if (dto.getMileage() != null) car.setMileage(dto.getMileage());
        if (dto.getNextOilChangeDate() != null) car.setNextOilChangeDate(dto.getNextOilChangeDate());
        if (dto.getNextOilChangeMileage() != null) car.setNextOilChangeMileage(dto.getNextOilChangeMileage());
        if (dto.getNextAppointmentDate() != null) car.setNextAppointmentDate(dto.getNextAppointmentDate());

        car = customerCarRepository.save(car);
        return toCustomerCarDTO(car);
    }

    @Transactional
    public void deleteCar(Long carId) {
        CustomerCar car = customerCarRepository.findById(carId)
                .orElseThrow(() -> new ResourceNotFoundException("Car", carId));
        customerCarRepository.delete(car);
    }

    private CustomerDTO toCustomerDTO(Customer c) {
        return CustomerDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .phone(c.getPhone())
                .email(c.getEmail())
                .city(c.getCity())
                .avatar(c.getAvatar())
                .isActive(c.getIsActive())
                .fcmToken(c.getFcmToken())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private CustomerCarDTO toCustomerCarDTO(CustomerCar c) {
        return CustomerCarDTO.builder()
                .id(c.getId())
                .customerId(c.getCustomer().getId())
                .make(c.getMake())
                .model(c.getModel())
                .year(c.getYear())
                .plateNumber(c.getPlateNumber())
                .color(c.getColor())
                .mileage(c.getMileage())
                .nextOilChangeDate(c.getNextOilChangeDate())
                .nextOilChangeMileage(c.getNextOilChangeMileage())
                .nextAppointmentDate(c.getNextAppointmentDate())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
