require 'roo'

module UserImports
  class RowError < StandardError; end

  class SpreadsheetParser
    ALLOWED_EXTENSIONS = %w[csv xls xlsx].freeze
    HEADER_MAPPING = {
      'full_name' => :full_name,
      'full name' => :full_name,
      'name' => :full_name,
      'email' => :email,
      'e-mail' => :email,
      'mail' => :email,
      'password' => :password,
      'senha' => :password,
      'role' => :role,
      'user_role' => :role,
      'tipo' => :role
    }.freeze

    def initialize(file_path, filename:)
      @file_path = file_path
      @filename = filename
      validate_extension!
    end

    def rows
      @rows ||= extract_rows
    end

    private

    attr_reader :file_path, :filename

    def extract_rows
      spreadsheet = Roo::Spreadsheet.open(file_path, extension: extension)
      header = build_header(spreadsheet.row(1))
      return [] if header.compact.empty?

      (2..spreadsheet.last_row).map do |index|
        row_values = spreadsheet.row(index)
        attributes = header.each_with_index.each_with_object({}) do |(attribute, header_index), memo|
          next if attribute.nil?

          memo[attribute] = normalize_value(row_values[header_index])
        end

        attributes.compact
      end.reject { |row| row.values.compact.blank? }
    end

    def build_header(raw_header)
      raw_header.map do |value|
        normalized = value.to_s.strip.downcase
        HEADER_MAPPING[normalized]
      end
    end

    def normalize_value(value)
      return nil if value.nil?

      if value.is_a?(String)
        cleaned = value.strip
        cleaned.empty? ? nil : cleaned
      else
        value
      end
    end

    def extension
      @extension ||= begin
        ext = File.extname(filename.to_s).delete('.').downcase
        ext = 'csv' if ext.blank?
        ext
      end
    end

    def validate_extension!
      return if ALLOWED_EXTENSIONS.include?(extension)

      raise ArgumentError, "Unsupported file extension: .#{extension}"
    end
  end
end


